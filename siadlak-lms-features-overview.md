# Siadlak LMS Platform - Architecture & Features Overview

This document outlines the high-level architecture and features of the Siadlak Learning Management System (LMS). It focuses on system design patterns and functionality rather than implementation details, to serve as a reference for rebuilding the platform with clear separation of concerns between architecture and editing agents.

## 1. System Architecture

### Separation of Concerns
- **Architecture Agent vs. Editing Agent Pattern**: Clear separation between architecture design (system understanding, component relationships, data flow) and implementation (code editing, feature implementation)
- **Bounded Contexts**: Well-defined domain boundaries with clear interfaces between subsystems
- **Clean Architecture**: Core business logic isolated from UI and infrastructure details
- **Domain-Driven Design**: System organized around business domains rather than technical constraints

### Component Architecture
- **Frontend Component Structure**: 
  - Presentation Layer: UI components, layouts, and views
  - Application Layer: Context providers, hooks, and services
  - Domain Layer: Models, validation, and business logic
  - Infrastructure Layer: API clients, storage adapters, and external service integrations

- **Backend Services**:
  - Authentication Service: Handles user identity and permissions
  - Content Service: Manages course structure and content
  - Progress Service: Tracks and updates user progress
  - Analytics Service: Collects and processes usage data

### Data Flow Architecture
- **Unidirectional Data Flow**: Clear and predictable state management
- **Command-Query Separation**: Distinct paths for reading and writing data
- **Event-Driven Updates**: Real-time UI updates based on system events
- **Optimistic UI Updates**: Immediate UI feedback with background synchronization

## 2. Authentication & Authorization

### Core Authentication Features
- **Discord OAuth Integration**: Users authenticate via Discord
- **Role-Based Access Control**: Access to courses is controlled through Discord roles
- **Admin Privileges**: Special admin accounts with extended platform capabilities
- **Authentication Persistence**: Session management with token-based auth
- **Development Mode**: Support for development login flow for testing

### User Identity & Profiles
- **Discord Profile Integration**: Username and avatar synchronization
- **User Role Management**: Management of user roles for course access control

## 3. Course Management

### Course Organization
- **Course Structure**: Courses contain modules, modules contain lessons
- **Sequential Learning Path**: Ordered modules and lessons with hierarchical navigation
- **Slug-Based Navigation**: Human-readable URLs using slugs for courses, modules, and lessons
- **Course Access Control**: Restricting courses to specific Discord roles

### Content Types & Media Support
- **Media Integration**: Support for video and audio content with embedded players
- **Text Content**: Markdown-based text lessons with rich formatting
- **Mixed Media Lessons**: Ability to combine different content types in a single lesson
- **Transcripts**: Support for including media transcripts with lessons

## 4. Learning Experience

### Content Display & Navigation
- **Content Rendering**: Markdown rendering for text content
- **Media Playback**: Video and audio playback with controls
- **Navigation Controls**: Next/previous lesson navigation
- **Learning Path Visualization**: Module and lesson progress tracking 
- **Continue Learning**: Quick access to resume from last visited lesson

### Progress Tracking
- **Lesson Completion**: Manual and automatic marking of lessons as complete
- **Media Progress**: Tracking of video/audio playback positions
- **Course Completion Tracking**: Overall progress percentage for each course
- **Progress Persistence**: Saving progress across sessions
- **Auto-completion**: Automatic marking of lessons as complete based on media consumption

## 5. User Interface & Experience

### UI Components
- **Responsive Design**: Mobile and desktop-friendly interface
- **Course Dashboard**: Overview of available courses with filtering options
- **Course Cards**: Visual representations of courses with progress indicators
- **Sidebar Navigation**: Course, module, and lesson navigation
- **Media Controls**: Playback controls for video/audio content including speed adjustment

### Organization Features
- **Progress Filtering**: Ability to filter courses by completion status
- **Categorization**: All/In Progress/Completed/Not Started course views
- **Continuous Learning**: "Continue Learning" feature to quickly resume last lesson

## 6. Administrative Capabilities

### Course Administration
- **Course CRUD Operations**: Create, read, update, and delete courses
- **Module Management**: Ability to add, edit, and reorder modules
- **Lesson Management**: Content creation and organization within modules
- **Content Publishing Control**: Ability to publish/unpublish lessons

### Access Control Management
- **Role Assignment**: Assign Discord roles to courses for access control
- **Course Permissions**: Set which Discord roles can access which courses
- **Admin Dashboard**: Administrative overview and management interface

### Content Creation Tools
- **Rich Content Editor**: Interface for creating and editing lesson content
- **Media Management**: Tools for managing media assets and embedding them in lessons
- **Course Structure Management**: Interface for organizing the learning path

## 7. Discord Integration

### Community Features
- **Discord Thread Links**: Integration with Discord threads for course discussions
- **Role Synchronization**: Synchronization with Discord roles for access control
- **Identity Management**: Using Discord profiles for user identity

## 8. Security & Performance

### Data Protection
- **Session Management**: Secure handling of authentication sessions
- **Permission Verification**: Server-side verification of access permissions
- **Failed Login Tracking**: Monitoring and logging of failed login attempts

### Technical Features
- **Responsive Performance**: Fast loading and smooth transitions between lessons
- **Progress Auto-saving**: Background saving of progress data
- **State Management**: Centralized application state management

## 9. Data Models

### Core Entities
- **Courses**: Top-level learning containers with metadata
- **Modules**: Organizational units within courses
- **Lessons**: Content units with various media types
- **Users**: User profiles and authentication data
- **Progress Records**: User progression through content
- **Role Associations**: Mappings between users, roles, and courses

## 10. Analytics & Monitoring

### Learning Analytics
- **Progress Monitoring**: Tracking user progression through courses
- **Completion Statistics**: Monitoring course completion rates
- **Media Consumption**: Tracking of video/audio playback progress
- **Authentication Monitoring**: Tracking of successful and failed login attempts

### System Health Monitoring
- **Performance Metrics**: Monitoring system response times and resource usage
- **Error Tracking**: Centralized logging and alerting for system errors
- **User Experience Metrics**: Tracking interaction patterns and pain points

## 11. Development Approach

### Architecture-First Development
- **System Metaphor**: Shared understanding of system concepts and terminology
- **Architecture Decision Records (ADRs)**: Documented architectural decisions and rationales
- **Component Contracts**: Clear interfaces between system components
- **Architectural Diagrams**: Visual representations of system relationships

### Agent-Based Development Process
- **Architecture Agent Responsibilities**:
  - System design and component relationships
  - Data flow and state management patterns
  - API design and integration points
  - Performance and security considerations
  - Database schema and data model design

- **Editing Agent Responsibilities**:
  - Implementation of component internals
  - Business logic implementation
  - UI component development
  - Testing and validation
  - Performance optimization at code level

### Development Workflow
- **Architecture-to-Implementation Pipeline**: 
  1. Architecture agent designs system components and relationships
  2. Architecture agent defines component interfaces and contracts
  3. Editing agent implements components according to specifications
  4. Architecture agent reviews implementation for architectural alignment
  5. Integration testing validates component interactions

- **Context Isolation**: Each agent works with appropriate level of system abstraction
- **Communication Protocol**: Standardized format for requirements and specifications
- **Feedback Loop**: Continual refinement based on implementation learning

---

This overview captures the high-level architecture and features of the Siadlak LMS platform, emphasizing separation of concerns between architectural understanding and implementation details. It provides a blueprint for rebuilding the platform with clear boundaries between architecture and editing responsibilities, enabling more efficient and maintainable development.
