import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import appInsights from 'applicationinsights';
import { getConnection, sql } from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import userRoutes from './routes/users.js';
import templateRoutes from './routes/templates.js';
import cycleRoutes from './routes/cycles.js';
import hrRoutes from './routes/hr.js';
import deptHeadRoutes from './routes/depthead.js';

dotenv.config();

// Application Insights
if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();
  console.log('✅ Application Insights initialized');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manual Initialize Database Schema (kept for manual resets)
app.post('/api/init-db', async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Drop existing tables in reverse order of dependencies
    await pool.request().query(`
      IF OBJECT_ID('ReviewAnswers', 'U') IS NOT NULL DROP TABLE ReviewAnswers;
      IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews;
      IF OBJECT_ID('CycleDepartments', 'U') IS NOT NULL DROP TABLE CycleDepartments;
      IF OBJECT_ID('ReviewCycles', 'U') IS NOT NULL DROP TABLE ReviewCycles;
      IF OBJECT_ID('TemplateQuestions', 'U') IS NOT NULL DROP TABLE TemplateQuestions;
      IF OBJECT_ID('ReviewTemplates', 'U') IS NOT NULL DROP TABLE ReviewTemplates;
      IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
      IF OBJECT_ID('Departments', 'U') IS NOT NULL DROP TABLE Departments;
    `);

    // Create Departments
    await pool.request().query(`
      CREATE TABLE Departments (
        DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
        DepartmentName NVARCHAR(100) NOT NULL UNIQUE,
        HeadUserID INT NULL
      );
    `);

    // Create Users
    await pool.request().query(`
      CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        Role NVARCHAR(50) NOT NULL CHECK (Role IN ('HR Admin', 'Dept Head', 'Staff')),
        DepartmentID INT NULL,
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
      );
    `);

    // Create ReviewTemplates
    await pool.request().query(`
      CREATE TABLE ReviewTemplates (
        TemplateID INT IDENTITY(1,1) PRIMARY KEY,
        TemplateName NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
      );
    `);

    // Create TemplateQuestions
    await pool.request().query(`
      CREATE TABLE TemplateQuestions (
        QuestionID INT IDENTITY(1,1) PRIMARY KEY,
        TemplateID INT NOT NULL,
        QuestionText NVARCHAR(1000) NOT NULL,
        QuestionType NVARCHAR(50) NOT NULL CHECK (QuestionType IN ('RatingScale1-5', 'OpenText')),
        DisplayOrder INT NOT NULL,
        FOREIGN KEY (TemplateID) REFERENCES ReviewTemplates(TemplateID) ON DELETE CASCADE
      );
    `);

    // Create ReviewCycles
    await pool.request().query(`
      CREATE TABLE ReviewCycles (
        CycleID INT IDENTITY(1,1) PRIMARY KEY,
        CycleName NVARCHAR(200) NOT NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        TemplateID INT NOT NULL,
        DeptHeadTemplateID INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (TemplateID) REFERENCES ReviewTemplates(TemplateID),
        FOREIGN KEY (DeptHeadTemplateID) REFERENCES ReviewTemplates(TemplateID)
      );
    `);

    // Create CycleDepartments
    await pool.request().query(`
      CREATE TABLE CycleDepartments (
        CycleDeptID INT IDENTITY(1,1) PRIMARY KEY,
        CycleID INT NOT NULL,
        DepartmentID INT NOT NULL,
        FOREIGN KEY (CycleID) REFERENCES ReviewCycles(CycleID) ON DELETE CASCADE,
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
      );
    `);

    // Create Reviews
    await pool.request().query(`
      CREATE TABLE Reviews (
        ReviewID INT IDENTITY(1,1) PRIMARY KEY,
        CycleID INT NOT NULL,
        RevieweeID INT NOT NULL,
        ReviewerID INT NOT NULL,
        TemplateID INT NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Completed', 'Acknowledged')),
        ManagerOverallComments NVARCHAR(MAX) NULL,
        GenAI_Summary NVARCHAR(MAX) NULL,
        StaffAcknowledgementComments NVARCHAR(MAX) NULL,
        SubmittedAt DATETIME NULL,
        AcknowledgedAt DATETIME NULL,
        FOREIGN KEY (CycleID) REFERENCES ReviewCycles(CycleID),
        FOREIGN KEY (RevieweeID) REFERENCES Users(UserID),
        FOREIGN KEY (ReviewerID) REFERENCES Users(UserID),
        FOREIGN KEY (TemplateID) REFERENCES ReviewTemplates(TemplateID)
      );
    `);

    // Create ReviewAnswers
    await pool.request().query(`
      CREATE TABLE ReviewAnswers (
        AnswerID INT IDENTITY(1,1) PRIMARY KEY,
        ReviewID INT NOT NULL,
        QuestionID INT NOT NULL,
        AnswerText NVARCHAR(MAX) NULL,
        AnswerRating INT NULL CHECK (AnswerRating BETWEEN 1 AND 5),
        FOREIGN KEY (ReviewID) REFERENCES Reviews(ReviewID) ON DELETE CASCADE,
        FOREIGN KEY (QuestionID) REFERENCES TemplateQuestions(QuestionID)
      );
    `);

    // Seed Data
    await pool.request().query(`
      INSERT INTO Departments (DepartmentName) VALUES 
      ('Cardiology'),
      ('Neurology'),
      ('Pediatrics'),
      ('Emergency Medicine');
    `);

    await pool.request().query(`
      INSERT INTO Users (FullName, Email, Role, DepartmentID) VALUES
      ('Admin User', 'admin@hospital.com', 'HR Admin', NULL),
      ('Dr. Rajesh Kumar', 'rajesh@hospital.com', 'Dept Head', 1),
      ('Dr. Priya Sharma', 'priya@hospital.com', 'Dept Head', 2),
      ('Dr. Amit Patel', 'amit@hospital.com', 'Staff', 1),
      ('Nurse Sita Devi', 'sita@hospital.com', 'Staff', 1),
      ('Dr. Neha Singh', 'neha@hospital.com', 'Staff', 2);
    `);

    await pool.request().query(`
      UPDATE Departments SET HeadUserID = 2 WHERE DepartmentID = 1;
      UPDATE Departments SET HeadUserID = 3 WHERE DepartmentID = 2;
    `);

    await pool.request().query(`
      INSERT INTO ReviewTemplates (TemplateName, Description) VALUES
      ('Standard Staff Review', 'General performance review for medical staff'),
      ('Department Head Review', 'Performance review for department heads');
    `);

    await pool.request().query(`
      INSERT INTO TemplateQuestions (TemplateID, QuestionText, QuestionType, DisplayOrder) VALUES
      (1, 'How would you rate the procedural accuracy of this staff member?', 'RatingScale1-5', 1),
      (1, 'How well does this staff member communicate with patients?', 'RatingScale1-5', 2),
      (1, 'Rate their teamwork and collaboration skills.', 'RatingScale1-5', 3),
      (1, 'Provide detailed feedback on areas of improvement.', 'OpenText', 4),
      (2, 'How effectively does this department head manage their team?', 'RatingScale1-5', 1),
      (2, 'Rate their strategic planning and decision-making.', 'RatingScale1-5', 2),
      (2, 'Provide overall feedback on leadership quality.', 'OpenText', 3);
    `);

    res.json({ 
      success: true, 
      message: 'Database schema created and seeded successfully!' 
    });
  } catch (error) {
    console.error('❌ Database Init Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/dh', deptHeadRoutes);

// Start server and auto-initialize database if needed
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT COUNT(*) as TableCount 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    if (result.recordset[0].TableCount === 0) {
      console.log('📦 Empty database detected. Auto-initializing...');
      
      try {
        // Drop existing tables
        await pool.request().query(`
          IF OBJECT_ID('ReviewAnswers', 'U') IS NOT NULL DROP TABLE ReviewAnswers;
          IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews;
          IF OBJECT_ID('CycleDepartments', 'U') IS NOT NULL DROP TABLE CycleDepartments;
          IF OBJECT_ID('ReviewCycles', 'U') IS NOT NULL DROP TABLE ReviewCycles;
          IF OBJECT_ID('TemplateQuestions', 'U') IS NOT NULL DROP TABLE TemplateQuestions;
          IF OBJECT_ID('ReviewTemplates', 'U') IS NOT NULL DROP TABLE ReviewTemplates;
          IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
          IF OBJECT_ID('Departments', 'U') IS NOT NULL DROP TABLE Departments;
        `);

        // Create Departments
        await pool.request().query(`
          CREATE TABLE Departments (
            DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
            DepartmentName NVARCHAR(100) NOT NULL UNIQUE,
            HeadUserID INT NULL
          );
        `);

        // Create Users
        await pool.request().query(`
          CREATE TABLE Users (
            UserID INT IDENTITY(1,1) PRIMARY KEY,
            FullName NVARCHAR(200) NOT NULL,
            Email NVARCHAR(255) NOT NULL UNIQUE,
            Role NVARCHAR(50) NOT NULL CHECK (Role IN ('HR Admin', 'Dept Head', 'Staff')),
            DepartmentID INT NULL,
            FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
          );
        `);

        // Create ReviewTemplates
        await pool.request().query(`
          CREATE TABLE ReviewTemplates (
            TemplateID INT IDENTITY(1,1) PRIMARY KEY,
            TemplateName NVARCHAR(200) NOT NULL,
            Description NVARCHAR(500) NULL,
            CreatedAt DATETIME DEFAULT GETDATE()
          );
        `);

        // Create TemplateQuestions
        await pool.request().query(`
          CREATE TABLE TemplateQuestions (
            QuestionID INT IDENTITY(1,1) PRIMARY KEY,
            TemplateID INT NOT NULL,
            QuestionText NVARCHAR(1000) NOT NULL,
            QuestionType NVARCHAR(50) NOT NULL CHECK (QuestionType IN ('RatingScale1-5', 'OpenText')),
            DisplayOrder INT NOT NULL,
            FOREIGN KEY (TemplateID) REFERENCES ReviewTemplates(TemplateID) ON DELETE CASCADE
          );
        `);

        // Create ReviewCycles
        await pool.request().query(`
          CREATE TABLE ReviewCycles (
            CycleID INT IDENTITY(1,1) PRIMARY KEY,
            CycleName NVARCHAR(200) NOT NULL,
            StartDate DATE NOT NULL,
            EndDate DATE NOT NULL,
            TemplateID INT NOT NULL,
            DeptHeadTemplateID INT NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (TemplateID) REFERENCES ReviewTemplates(TemplateID),
            FOREIGN KEY (DeptHeadTemplateID) REFERENCES ReviewTemplates(TemplateID)
          );
        `);

        // Create CycleDepartments
        await pool.request().query(`
          CREATE TABLE CycleDepartments (
            CycleDeptID INT IDENTITY(1,1) PRIMARY KEY,
            CycleID INT NOT NULL,
            DepartmentID INT NOT NULL,
            FOREIGN KEY (CycleID) REFERENCES ReviewCycles(CycleID) ON DELETE CASCADE,
            FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
          );
        `);

        // Create Reviews
        await pool.request().query(`
          CREATE TABLE Reviews (
            ReviewID INT IDENTITY(1,1) PRIMARY KEY,
            CycleID INT NOT NULL,
            RevieweeID INT NOT NULL,
            ReviewerID INT NOT NULL,
            TemplateID INT NOT NULL,
            Status NVARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Completed', 'Acknowledged')),
            ManagerOverallComments NVARCHAR(MAX) NULL,
            GenAI_Summary NVARCHAR(MAX) NULL,
            StaffAcknowledgementComments NVARCHAR(MAX) NULL,
            SubmittedAt DATETIME NULL,
            AcknowledgedAt DATETIME NULL,
            FOREIGN KEY (CycleID) REFERENCES ReviewCycles(CycleID),
            FOREIGN KEY (RevieweeID) REFERENCES Users(UserID),
            FOREIGN KEY (ReviewerID) REFERENCES Users(UserID),
            FOREIGN KEY (TemplateID) REFERENCES ReviewTemplates(TemplateID)
          );
        `);

        // Create ReviewAnswers
        await pool.request().query(`
          CREATE TABLE ReviewAnswers (
            AnswerID INT IDENTITY(1,1) PRIMARY KEY,
            ReviewID INT NOT NULL,
            QuestionID INT NOT NULL,
            AnswerText NVARCHAR(MAX) NULL,
            AnswerRating INT NULL CHECK (AnswerRating BETWEEN 1 AND 5),
            FOREIGN KEY (ReviewID) REFERENCES Reviews(ReviewID) ON DELETE CASCADE,
            FOREIGN KEY (QuestionID) REFERENCES TemplateQuestions(QuestionID)
          );
        `);

        // Seed Data
        await pool.request().query(`
          INSERT INTO Departments (DepartmentName) VALUES 
          ('Cardiology'),
          ('Neurology'),
          ('Pediatrics'),
          ('Emergency Medicine');
        `);

        await pool.request().query(`
          INSERT INTO Users (FullName, Email, Role, DepartmentID) VALUES
          ('Admin User', 'admin@hospital.com', 'HR Admin', NULL),
          ('Dr. Rajesh Kumar', 'rajesh@hospital.com', 'Dept Head', 1),
          ('Dr. Priya Sharma', 'priya@hospital.com', 'Dept Head', 2),
          ('Dr. Amit Patel', 'amit@hospital.com', 'Staff', 1),
          ('Nurse Sita Devi', 'sita@hospital.com', 'Staff', 1),
          ('Dr. Neha Singh', 'neha@hospital.com', 'Staff', 2);
        `);

        await pool.request().query(`
          UPDATE Departments SET HeadUserID = 2 WHERE DepartmentID = 1;
          UPDATE Departments SET HeadUserID = 3 WHERE DepartmentID = 2;
        `);

        await pool.request().query(`
          INSERT INTO ReviewTemplates (TemplateName, Description) VALUES
          ('Standard Staff Review', 'General performance review for medical staff'),
          ('Department Head Review', 'Performance review for department heads');
        `);

        await pool.request().query(`
          INSERT INTO TemplateQuestions (TemplateID, QuestionText, QuestionType, DisplayOrder) VALUES
          (1, 'How would you rate the procedural accuracy of this staff member?', 'RatingScale1-5', 1),
          (1, 'How well does this staff member communicate with patients?', 'RatingScale1-5', 2),
          (1, 'Rate their teamwork and collaboration skills.', 'RatingScale1-5', 3),
          (1, 'Provide detailed feedback on areas of improvement.', 'OpenText', 4),
          (2, 'How effectively does this department head manage their team?', 'RatingScale1-5', 1),
          (2, 'Rate their strategic planning and decision-making.', 'RatingScale1-5', 2),
          (2, 'Provide overall feedback on leadership quality.', 'OpenText', 3);
        `);

        console.log('✅ Database auto-initialized successfully!');
        console.log('✅ Database contains 8 tables with seed data');
      } catch (initError) {
        console.error('❌ Auto-initialization failed:', initError.message);
      }
    } else {
      console.log(`✅ Database already initialized with ${result.recordset[0].TableCount} tables`);
    }
  } catch (error) {
    console.warn('⚠️ Could not verify database:', error.message);
  }
});
