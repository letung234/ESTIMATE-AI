# AI-Powered Project Estimator

A complete project estimation tool with mock API that allows you to create projects, break down features into tasks, and get intelligent cost estimates with risk analysis.

## Features

### 1. **Dashboard** 
- View all projects with their estimation status
- Quick stats on total hours, average confidence, and active projects
- Open, edit, or delete projects
- See budget information and estimation accuracy

### 2. **Create Project**
- Start a new estimation project
- Input project name, type (New/Maintenance/Migration), budget, and template
- Upload supporting documents
- Mock API simulates document analysis

### 3. **Document Preview**
- Review parsed content from project requirements
- View extracted features, requirements, and constraints
- Confidence metrics for each section
- Confirm and proceed to feature breakdown

### 4. **Feature & Task Breakdown**
- Define features for your project
- Break each feature into detailed tasks (Dev/QA/PM hours)
- Add/edit/delete features and tasks in real-time
- Risk assessment (Low/Medium/High) automatically calculated
- Real-time hour calculations

### 5. **Estimation Results**
- Automatic hour calculation (Dev, QA, PM)
- Project confidence score
- Risk detection and mitigation suggestions
- Budget status comparison
- Optimization recommendations

### 6. **Clarification Questions**
- AI-generated questions based on missing information
- Answer pending questions to improve estimate accuracy
- Add custom clarification questions
- Confidence score updates with answered questions

### 7. **Export & Approve**
- Review complete project summary
- View all features and their task breakdowns
- Export to PDF or Excel formats
- Final approval workflow
- Status tracking (Draft â†? Approved)

## Tech Stack

- **Frontend**: React 19 + Next.js 16
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State Management**: React hooks
- **API**: Mock API service with realistic data simulation
- **Icons**: Lucide React

## Mock API Features

The application uses a comprehensive mock API (`lib/mockApi.ts`) that simulates:

- Project CRUD operations
- Feature management
- Task estimation and tracking
- Clarification question handling
- Risk analysis
- Export functionality (PDF/Excel)
- Real-time data persistence in memory

### Sample Data

The app comes with 3 pre-loaded demo projects:

1. **E-Commerce Platform Redesign** (Completed)
   - 2 features, 3 tasks
   - 132 total hours estimated
   - 92% confidence

2. **Mobile App MVP** (In Progress)
   - 2 features, 3 tasks
   - 113 total hours estimated
   - 68% confidence (pending clarifications)

3. **Legacy System Migration** (Draft)
   - Ready for estimation

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# Visit http://localhost:3000
```

## Workflow Example

1. **Start**: Click "New Project" on the dashboard
2. **Create**: Fill in project details and submit
3. **Preview**: Review document analysis
4. **Breakdown**: Define features and tasks with hour estimates
5. **Estimate**: View risk analysis and budget comparison
6. **Clarify**: Answer pending questions to improve accuracy
7. **Export**: Download PDF/Excel and approve estimate
8. **Return**: Project appears on dashboard with status

## Key Components

- `EstimatorApp.tsx` - Main app container managing screen navigation
- `mockApi.ts` - Complete mock API service with realistic delays
- `screens/` - Individual workflow screens
  - Dashboard.tsx - Project overview
  - CreateProject.tsx - New project form
  - DocumentPreview.tsx - Document analysis view
  - FeatureBreakdown.tsx - Feature/task management
  - EstimationResult.tsx - Results with risk analysis
  - ClarificationList.tsx - Q&A interface
  - ExportApprove.tsx - Export and approval workflow

## Color Scheme

- **Primary**: #1a5f9e (Professional Blue)
- **Accent Colors**: Green (success), Orange (warning), Red (error)
- **Neutrals**: Light gray backgrounds, dark text for contrast

## Features Showcase

âœ? Complete UI flow with 7 interconnected screens  
âœ? Mock API with realistic data and delays  
âœ? Real-time feature and task management  
âœ? Intelligent risk assessment  
âœ? Budget tracking and comparison  
âœ? Clarification question system  
âœ? Export capabilities (PDF/Excel)  
âœ? Responsive design (mobile to desktop)  
âœ? Professional styling with Tailwind CSS  
âœ? Interactive data updates

## Demo Mode

The app works entirely with mock data - no backend required. All actions (create, update, delete, export) are simulated with realistic responses and UI feedback.

Perfect for:
- UI/UX demonstrations
- Product showcases
- Team training
- Design inspiration

---
