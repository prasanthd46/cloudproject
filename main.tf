# 1. Configure the Azure Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 2. Helper to create unique names
resource "random_id" "id" {
  byte_length = 8
}

# 3. Create a Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "MedicalReview-RG"
  location = "southeastasia"
}

# 4. Create the Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "medicalreviewacr${random_id.id.hex}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# 5. Log Analytics Workspace (CREATE BEFORE AKS)
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "medicalreview-logs-${random_id.id.hex}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# 6. Create the AKS Cluster (WITH MONITORING)
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "MedicalReview-AKS-Cluster"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "medicalreview-dns"
  sku_tier            = "Free"

  default_node_pool {
    name                = "default"
    node_count          = 1
    vm_size             = "Standard_B2s"
    enable_auto_scaling = true
    min_count           = 1
    max_count           = 2
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "kubenet"
  }

  # ADD MONITORING HERE
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  }
}

# 7. Grant AKS AcrPull role on ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.aks.identity[0].principal_id
}

# 8. Create the SQL Server
resource "azurerm_mssql_server" "sqlserver" {
  name                         = "medicalreview-sqlserver-${random_id.id.hex}"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = "Password1234!"
}

# 9. Create the SQL Database (Serverless)
resource "azurerm_mssql_database" "sqldb" {
  name           = "MedicalReview-DB"
  server_id      = azurerm_mssql_server.sqlserver.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  sku_name       = "GP_S_Gen5_1"
  zone_redundant = false
  auto_pause_delay_in_minutes = 60
  min_capacity   = 0.5
}

# 10. Create the SQL Firewall Rule
resource "azurerm_mssql_firewall_rule" "sqlfirewall" {
  name             = "AllowAllWindowsAzureIps"
  server_id        = azurerm_mssql_server.sqlserver.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

# 11. Create the AI Service
resource "azurerm_cognitive_account" "ai_language" {
  name                = "medicalreview-ai-lang-${random_id.id.hex}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind                = "TextAnalytics"
  sku_name            = "F0"
}

# 12. Application Insights
resource "azurerm_application_insights" "appinsights" {
  name                = "medicalreview-insights-${random_id.id.hex}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "Node.JS"
  workspace_id        = azurerm_log_analytics_workspace.logs.id
}

# 13. Outputs
output "ACR_LOGIN_SERVER" {
  value = azurerm_container_registry.acr.login_server
}

output "SQL_SERVER_NAME" {
  value = azurerm_mssql_server.sqlserver.fully_qualified_domain_name
}

output "SQL_DATABASE_NAME" {
  value = azurerm_mssql_database.sqldb.name
}

output "AI_LANGUAGE_ENDPOINT" {
  value = azurerm_cognitive_account.ai_language.endpoint
}

output "AKS_CLUSTER_NAME" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "RESOURCE_GROUP_NAME" {
  value = azurerm_resource_group.rg.name
}

output "APPINSIGHTS_CONNECTION_STRING" {
  value     = azurerm_application_insights.appinsights.connection_string
  sensitive = true
}
