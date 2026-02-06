# FluffNwoof - Development Workflow

## Engineering Standards (CRITICAL)

### Enterprise Development Philosophy

Apply the **highest global engineering standards** for:
- **Stability**: Rock-solid, production-ready code
- **Performance**: Optimized, fast, and efficient
- **Scalability**: Ready for unlimited growth
- **Flexibility**: Easy to extend and maintain
- **Quality**: Clean, readable, well-structured code

### Development Principles

1. **Plan Before Code**
   - Analyze requirements deeply before implementation
   - Consider edge cases and error handling
   - Think about performance implications
   - Design for future extensibility

2. **Use Shared Components**
   - Always check for existing shared components before creating new ones
   - Reuse UI components from `frontend/src/components/`
   - Reuse backend services from `backend/src/services/`
   - Reuse utilities and helpers
   - Maintain consistency across the application

3. **Code Quality Standards**
   - TypeScript strict mode
   - Proper error handling
   - Input validation
   - Security best practices (OWASP)
   - Clean code principles (DRY, SOLID, KISS)

4. **Testing Mindset**
   - Test on localhost thoroughly before deployment
   - Consider all user scenarios
   - Verify database operations
   - Check API responses

---

## Deployment Rules (IMPORTANT)

**DO NOT push or deploy automatically. Always wait for explicit user approval.**

### Workflow Steps:

1. **Development (localhost)**
   - Code: localhost
   - Database: Neon branch `development`
   - Action: Develop and test here only
   - Wait for user to say: **"deploy"** or **"ارفع training"**

2. **Training (Render)**
   - Code: Render Training environment
   - Database: Neon branch `training`
   - Git branch: `training`
   - Wait for user to say: **"production"** or **"ارفع production"**

3. **Production (Render)**
   - Code: Render Production environment
   - Database: Neon branch `production`
   - Git branch: `main`

### Commands Reference:

| User Says | Action |
|-----------|--------|
| Any development request | Work on localhost ONLY |
| "deploy" or "ارفع training" | Commit and push to `training` branch |
| "production" or "ارفع production" | Merge `training` to `main` and deploy |

### Environment Variables:

#### Email (Resend API for Render):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

#### SMS (Madar):
- `MADAR_SENDER_NAME=FluffnWoof`

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon with branching)
- **Hosting**: Render (Training & Production)
- **SMS**: Madar SMS API
- **Email**: Resend API (Render) / SMTP (localhost)

## Shared Components Architecture

### Frontend Shared Components
Check these locations before creating new components:
- `frontend/src/components/ui/` - Base UI components
- `frontend/src/components/common/` - Common shared components
- `frontend/src/components/layout/` - Layout components
- `frontend/src/hooks/` - Custom React hooks
- `frontend/src/utils/` - Utility functions
- `frontend/src/services/` - API service calls

### Backend Shared Services
Check these locations before creating new services:
- `backend/src/services/` - Business logic services
- `backend/src/utils/` - Utility functions
- `backend/src/middleware/` - Express middleware
- `backend/src/validators/` - Input validation schemas

### Reusability Rules
1. **Search first**: Always search for existing implementations
2. **Extend, don't duplicate**: Extend existing components if needed
3. **Keep DRY**: Don't Repeat Yourself
4. **Consistent patterns**: Follow existing code patterns
