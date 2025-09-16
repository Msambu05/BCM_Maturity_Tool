# BCM Maturity Tool

A comprehensive Business Continuity Management (BCM) maturity assessment system built with Django REST Framework and React.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development](#development)
- [Deployment](#deployment)

## Overview

The BCM Maturity Tool is designed to help organizations assess and improve their Business Continuity Management capabilities. It provides a structured framework for evaluating maturity across multiple focus areas, tracking progress, and generating comprehensive reports.

### Key Components

- **Backend**: Django REST API with JWT authentication
- **Frontend**: React application with modern UI
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT-based user authentication with role-based access

## Architecture

### Backend Structure

```
backend/
├── backend/                 # Django project settings
├── users/                   # User management and authentication
├── assessments/             # Assessment core functionality
├── evidence/                # File upload and evidence management
├── reports/                 # Report generation and PDF creation
├── scoring/                 # Maturity scoring calculations
├── notifications/           # Notification system
└── dashboard/               # Analytics and dashboard data
```

### Frontend Structure

```
frontend/
├── src/
│   ├── api/                 # API client and utilities
│   ├── pages/               # React components
│   └── App.js               # Main application component
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

### Data Model

- **Organization**: Top-level organizational structure
- **Department**: Sub-organizational units
- **User**: System users with roles (Admin, BCM Coordinator, etc.)
- **FocusArea**: Assessment categories (6 core areas)
- **Question**: Individual assessment questions
- **Assessment**: Assessment instances
- **AssessmentResponse**: User responses to questions
- **Evidence**: File attachments supporting responses

## Features

### Core Functionality

- ✅ Multi-organization support
- ✅ Role-based access control
- ✅ Comprehensive assessment framework
- ✅ File evidence upload and management
- ✅ Automated scoring and maturity calculation
- ✅ PDF report generation
- ✅ Notification system
- ✅ Dashboard analytics
- ✅ RESTful API

### Assessment Framework

The system evaluates maturity across 6 focus areas:

1. **Establishing a BCMS** (FA01)
2. **Embracing Business Continuity** (FA02)
3. **Analysis** (FA03)
4. **Solution Design** (FA04)
5. **Enabling Solutions** (FA05)
6. **Validation** (FA06)

Each focus area contains multiple questions with maturity scoring from 0-5.

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bcm-maturity-tool
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Load development data (optional)**
   ```bash
   python manage.py clean_and_load_dev_data
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start Django server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install Node dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start React development server**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin panel: http://localhost:8000/admin

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Django Settings

Key configuration in `backend/backend/settings.py`:

- **Database**: SQLite for development, PostgreSQL for production
- **Authentication**: JWT tokens with 60-minute access, 7-day refresh
- **CORS**: Configured for React development server
- **Media**: File uploads stored in `media/` directory
- **Email**: Console backend for development

## Usage

### User Roles

1. **Admin**: Full system access, user management
2. **BCM Coordinator**: Assessment management and oversight
3. **Business Unit Champion**: Department-level assessments
4. **Steering Committee**: Executive reporting and approval

### Assessment Workflow

1. **Setup**: Create organizations and departments
2. **Create Assessment**: Define assessment scope and timeline
3. **Respond**: Users answer questions and upload evidence
4. **Review**: Coordinators review responses
5. **Report**: Generate maturity reports and analytics

### API Usage

The system provides a complete REST API for all operations:

```bash
# Authentication
POST /api/auth/login/
POST /api/auth/refresh/

# Organizations
GET /api/organizations/
POST /api/organizations/

# Assessments
GET /api/assessments/
POST /api/assessments/
GET /api/assessments/{id}/questions/
POST /api/assessments/{id}/responses/

# Evidence
POST /api/evidence/
GET /api/evidence/{id}/download/

# Reports
GET /api/reports/
POST /api/reports/generate/
```

## API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

#### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "refresh_token_here"
}
```

### Assessment Endpoints

#### List Assessments
```http
GET /api/assessments/
Authorization: Bearer <access_token>
```

#### Create Assessment
```http
POST /api/assessments/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Q1 2024 Assessment",
  "description": "Quarterly BCM assessment",
  "organization": 1,
  "department": 1,
  "due_date": "2024-03-31"
}
```

#### Submit Response
```http
POST /api/assessments/{id}/responses/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "question": 1,
  "maturity_score": 3,
  "comments": "Good progress made",
  "rationale": "Implemented basic procedures"
}
```

### File Upload

#### Upload Evidence
```http
POST /api/evidence/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

assessment_response: 1
file: <file_data>
description: "Supporting documentation"
```

## Testing

### Backend Testing

1. **Run all tests**
   ```bash
   cd backend
   python manage.py test
   ```

2. **Run specific app tests**
   ```bash
   python manage.py test assessments
   python manage.py test users
   ```

3. **Load test data**
   ```bash
   python manage.py clean_and_load_dev_data
   ```

### Frontend Testing

1. **Run React tests**
   ```bash
   cd frontend
   npm test
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

### API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Get authentication token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password"}'

# Use token for authenticated requests
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/assessments/
```

## Development

### Code Structure

- **Models**: Define data structures in `models.py`
- **Serializers**: Handle data serialization in `serializers.py`
- **Views**: Implement API endpoints in `views.py`
- **URLs**: Define URL patterns in `urls.py`
- **Tests**: Write unit tests in `tests.py`

### Adding New Features

1. **Create model** in appropriate app
2. **Run migrations**: `python manage.py makemigrations && python manage.py migrate`
3. **Create serializer** for API representation
4. **Implement viewset** or APIView
5. **Add URL patterns**
6. **Update frontend** to consume new endpoints

### Database Schema

The system uses Django's ORM with the following key relationships:

- User → Organization (Many-to-One)
- Department → Organization (Many-to-One)
- Assessment → Organization, Department (Many-to-One)
- Question → FocusArea (Many-to-One)
- AssessmentResponse → Assessment, Question, User (Many-to-One)
- Evidence → AssessmentResponse (Many-to-One)

## Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure production database (PostgreSQL)
- [ ] Set secure `SECRET_KEY`
- [ ] Configure production email backend
- [ ] Set up file storage (AWS S3 or similar)
- [ ] Configure HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Docker Deployment

```dockerfile
# Dockerfile example
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Environment Variables for Production

```env
DEBUG=False
SECRET_KEY=<secure-key>
DATABASE_URL=postgresql://user:pass@host:port/db
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Version**: 1.0.0
**Last Updated**: 2024
**Django Version**: 5.2.5
**React Version**: 18.2.0
