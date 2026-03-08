# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Display active announcements from MongoDB
- Manage announcements (create, update, delete) for signed-in staff

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity                                             |
| GET    | `/announcements`                                                  | Get currently active announcements                                  |
| GET    | `/announcements/manage?teacher_username={username}`               | Get all announcements for management UI (authenticated)             |
| POST   | `/announcements?teacher_username={username}`                      | Create announcement (requires expiration date)                      |
| PUT    | `/announcements/{announcement_id}?teacher_username={username}`    | Update announcement                                                 |
| DELETE | `/announcements/{announcement_id}?teacher_username={username}`    | Delete announcement                                                 |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

Data is stored in MongoDB, which means data is persisted across application and server restarts under normal operation.

On startup, the application checks the relevant MongoDB collections and inserts sample activities, teachers, and an example announcement **only when those collections are empty** (for example, on first run or after the collections have been manually cleared).

Existing data in non-empty collections is **not** overwritten or reset on server restart; to reinitialize the sample data, you must explicitly clear or drop the corresponding MongoDB collections.
