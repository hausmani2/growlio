# 🚀 Growlio Frontend Development Guide for Cursor

## 📋 Project Overview

**Growlio** is a React-based restaurant management application with a focus on financial analytics, onboarding workflows, and user management. This guide provides comprehensive instructions for maintaining consistency when creating new pages and components.

## 🎨 Design System & Styling

### Color Palette
- **Primary Orange**: `bg-orange-500`, `text-orange-500`, `hover:bg-orange-600`
- **Secondary Colors**: 
  - Green: `text-green-600` (success states)
  - Red: `text-red-600` (error states, closed days)
  - Blue: `text-blue-500` (icons, links)
- **Neutral Colors**: `text-gray-600`, `bg-gray-100`, `text-gray-500`

### Typography
- **Headings**: Use `font-semibold` or `font-bold` for main titles
- **Body Text**: Default font weight for regular content
- **Small Text**: `text-xs` for secondary information (dates, labels)
- **Success/Error Text**: `text-sm font-medium` for status messages

### Spacing & Layout
- **Standard Padding**: `px-8 py-3` for primary buttons
- **Card Spacing**: `p-6` for main content areas
- **Section Gaps**: `gap-6` or `gap-8` between major sections
- **Form Spacing**: `mt-4` or `mt-6` between form elements

## 🏗️ Component Architecture

### Page Structure Template
```jsx
// Standard page wrapper structure
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-orange-500 mb-2">
        Page Title
      </h1>
      <p className="text-gray-600">
        Page description or subtitle
      </p>
    </div>
    
    {/* Main Content */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Content goes here */}
    </div>
  </div>
</div>
```

### Card Component Pattern
```jsx
// Standard card wrapper for content sections
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900">
      Section Title
    </h2>
  </div>
  {/* Card content */}
</div>
```

## 🔐 Authentication & User Management

### Protected Routes
- All main application pages should be wrapped in `ProtectedRoutes`
- Use the existing auth context and Zustand store
- Redirect unauthenticated users to login

### User Profile System
- **Profile Page**: `/profile` route with tabbed interface
- **Settings Section**: Located at bottom of left sidebar
- **Password Management**: Change password and delete account functionality

### Password Reset Flow
- **Forgot Password**: `/forgot-password` - email input form
- **Reset Password**: `/reset-password` - token + new password form
- **Email Design**: Professional HTML emails with direct reset links

## 📊 Dashboard & Data Tables

### Table Component Standards
```jsx
// Standard table column configuration
{
  title: 'Column Title',
  dataIndex: 'fieldName',
  key: 'fieldName',
  width: 140, // Use consistent widths: 140px, 160px, 150px
  render: (value, record, index) => (
    <div className="min-w-[140px]"> {/* Prevent layout shifts */}
      {/* Content */}
    </div>
  )
}
```

### Column Width Standards
- **Day Column**: `width: 160` (accommodates "CLOSED" label)
- **Toggle Columns**: `width: 140` (fits toggle switches + text)
- **Input Columns**: `width: 140` (fits number inputs)
- **Text Columns**: `width: 150` (fits longer text content)

### Toggle Switch Implementation
```jsx
// Standard toggle switch usage
<ToggleSwitch
  isOn={booleanValue}
  setIsOn={(checked) => handleChange(index, 'field', checked ? 1 : 0)}
  size="large" // Always use "large" for consistency
/>
```

### Table Layout Stability
- **Prevent Layout Shifts**: Use `min-w-[width]` classes
- **Fixed Column Widths**: Set explicit widths for all columns
- **Content Overflow**: Use `whitespace-nowrap` for labels like "CLOSED"
- **Consistent Spacing**: Maintain `gap-3` between toggle and text

## 🚀 Onboarding Workflow

### Step Navigation Pattern
```jsx
// Standard onboarding step structure
<div className="min-h-screen bg-gray-50">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Breadcrumb Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-orange-500 mb-2">
        Onboarding > Step Name
      </h1>
      <p className="text-gray-600">
        Step description and instructions
      </p>
    </div>
    
    {/* Step Content */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Form content */}
    </div>
    
    {/* Save Button */}
    <div className="mt-8 pt-6 border-t border-gray-200">
      <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold">
        Save Changes
      </button>
    </div>
  </div>
</div>
```

### Save Button Standards
- **Background**: `bg-orange-500`
- **Hover**: `hover:bg-orange-600`
- **Padding**: `px-8 py-3`
- **Font**: `font-semibold`
- **Positioning**: `mt-8 pt-6` (away from bottom)
- **Border**: `border-t border-gray-200` above button

### Onboarding Steps
1. **Basic Information** - Restaurant details, addresses
2. **Labour Information** - Staff details, labor costs
3. **Food Cost Details** - Food costs, delivery, third-party providers
4. **Sales Channels** - Revenue streams configuration
5. **Expense** - Fixed and variable costs

## 📅 Date & Calendar Components

### Custom Date Picker Implementation
- **Don't use Ant Design RangePicker** - it has navigation limitations
- **Use Custom Calendar**: Implemented in `CalendarUtils.jsx`
- **Navigation Controls**: Full bidirectional month/year navigation
- **Week Selection**: Selects full week ranges automatically
- **Click Outside**: Closes calendar when clicking outside

### Date Formatting
- **Display Format**: `MMM DD, YYYY` (e.g., "Aug 10, 2025")
- **Week Numbers**: Use `weekNumber` for week identification
- **Date Validation**: Ensure dates are within valid ranges

## 🔔 Notification & Feedback

### Success Message Standards
- **Timing**: Show on `onBlur`, not `onChange`
- **Content**: Specific, actionable messages
- **Format**: "Action completed for [specific item]"
- **Example**: "Budgeted sales of $1234 added for Sunday"

### Error Message Standards
- **Validation Errors**: Show immediately on form submission
- **API Errors**: Display in user-friendly format
- **Warning Messages**: Use for non-blocking issues

### Message Display Rules
- **No Spam**: Don't show messages on every keystroke
- **User Control**: Wait for user to finish input
- **Single Message**: One confirmation per action
- **Professional Tone**: Clear, concise language

## 📱 Responsive Design

### Breakpoint Strategy
- **Mobile First**: Design for small screens first
- **Tablet**: `sm:` prefix for tablet layouts
- **Desktop**: `lg:` and `xl:` for larger screens
- **Consistent Spacing**: Use responsive padding/margins

### Mobile Considerations
- **Touch Targets**: Minimum 44px for interactive elements
- **Form Inputs**: Adequate spacing between form fields
- **Navigation**: Collapsible sidebar for mobile
- **Tables**: Horizontal scroll for data tables

## 🎯 Form Implementation

### Input Field Standards
```jsx
// Standard input field pattern
<Input
  type="number"
  value={value}
  onChange={(e) => handleChange(index, 'field', parseFloat(e.target.value) || 0)}
  onBlur={(e) => handleBlur(index, parseFloat(e.target.value) || 0, record)}
  placeholder="0.00"
  className="w-full"
  disabled={isDisabled}
  style={{ 
    opacity: isDisabled ? 0.5 : 1,
    cursor: isDisabled ? 'not-allowed' : 'text'
  }}
/>
```

### Form Validation
- **Client-Side**: Immediate feedback for user experience
- **Server-Side**: Final validation before saving
- **Error Display**: Clear, specific error messages
- **Required Fields**: Visual indicators for mandatory inputs

## 🔧 State Management

### Zustand Store Usage
- **Auth State**: User authentication and profile data
- **Dashboard Data**: Sales, expenses, labor information
- **Onboarding State**: Step progress and form data
- **Loading States**: API call status management

### State Update Patterns
```jsx
// Standard state update pattern
const handleDataChange = (index, field, value) => {
  const newData = [...formData];
  newData[index] = { ...newData[index], [field]: value };
  setFormData({ ...formData, data: newData });
};
```

## 🐍 Backend Development Standards

### Django Project Structure
```
growlio-python-api/
├── authentication/           # User authentication & profile management
│   ├── models.py            # Custom User model
│   ├── serializers.py       # API serializers
│   ├── views.py             # API views
│   └── urls.py              # Authentication routes
├── restaurant/               # Core business logic
│   ├── models.py            # Restaurant, sales, expense models
│   ├── views.py             # Business logic views
│   └── utils.py             # Business logic utilities
├── growlio/                  # Project configuration
│   ├── settings.py          # Django settings & database config
│   └── urls.py              # Main URL configuration
└── manage.py                 # Django management script
```

### Django Model Standards
```python
# Standard model structure
class ModelName(models.Model):
    # Always include created/updated timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use descriptive field names
    field_name = models.CharField(max_length=255, verbose_name="Human Readable Name")
    
    # Include helpful meta information
    class Meta:
        verbose_name = "Model Display Name"
        verbose_name_plural = "Model Display Names"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.field_name}"
```

### API View Standards
```python
# Standard API view structure
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_view_name(request):
    try:
        if request.method == 'GET':
            # Handle GET request
            data = get_data()
            return Response(data, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Handle POST request
            serializer = YourSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

### Serializer Standards
```python
# Standard serializer structure
from rest_framework import serializers
from .models import YourModel

class YourModelSerializer(serializers.ModelSerializer):
    # Include computed fields if needed
    computed_field = serializers.SerializerMethodField()
    
    class Meta:
        model = YourModel
        fields = '__all__'  # Or specify fields explicitly
        read_only_fields = ['created_at', 'updated_at']
    
    def get_computed_field(self, obj):
        # Method for computed fields
        return obj.calculate_something()
    
    def validate_field_name(self, value):
        # Custom validation
        if value < 0:
            raise serializers.ValidationError("Value must be positive")
        return value
```

### URL Pattern Standards
```python
# Standard URL pattern structure
from django.urls import path
from . import views

urlpatterns = [
    # Use descriptive URL names
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('delete-account/', views.DeleteAccountView.as_view(), name='delete-account'),
    
    # Include trailing slashes for consistency
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
]
```

### Database Migration Standards
```python
# Standard migration structure
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('app_name', 'previous_migration'),
    ]
    
    operations = [
        # Always use descriptive operation names
        migrations.AddField(
            model_name='modelname',
            name='field_name',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        
        # Include data migrations if needed
        migrations.RunPython(
            code=your_data_migration_function,
            reverse_code=your_reverse_function
        ),
    ]
```

### Error Handling Standards
```python
# Standard error handling in views
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class YourAPIView(APIView):
    def post(self, request):
        try:
            # Your logic here
            serializer = YourSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {'message': 'Success message'}, 
                    status=status.HTTP_201_CREATED
                )
            return Response(
                {'errors': serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'details': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Unexpected error: {str(e)}")
            return Response(
                {'error': 'An unexpected error occurred'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Authentication Standards
```python
# Standard authentication view structure
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    if request.method == 'GET':
        # Handle GET request
        pass
    elif request.method == 'PUT':
        # Handle PUT request
        pass

# Admin-only views
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_only_view(request):
    # Admin-only functionality
    pass
```

### Email Standards
```python
# Standard email sending structure
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_professional_email(subject, template_name, context, recipient_list):
    # Render HTML email
    html_message = render_to_string(template_name, context)
    
    # Create plain text version
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=None,  # Uses DEFAULT_FROM_EMAIL
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )
```

### Environment Configuration
```python
# Standard environment variable usage
from decouple import config

# Database configuration
DB_HOST = config('DB_HOST', default='localhost')
DB_SSL_MODE = 'require' if DB_HOST != 'localhost' else None

# Security settings
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

# Email configuration
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
```

## 🚫 Common Anti-Patterns to Avoid

### Frontend UI/UX Issues
- ❌ **Layout Shifts**: Don't let content overflow affect other columns
- ❌ **Popup Spam**: Don't show notifications on every keystroke
- ❌ **Inconsistent Button Styling**: Maintain button appearance standards
- ❌ **Poor Mobile Experience**: Always test responsive behavior

### Frontend Code Issues
- ❌ **Hardcoded Values**: Use constants and configuration files
- ❌ **Inline Styles**: Prefer Tailwind classes and CSS modules
- ❌ **Complex Render Functions**: Keep table render functions simple
- ❌ **Missing Error Handling**: Always handle API failures gracefully

### Backend Anti-Patterns
- ❌ **Missing Permission Classes**: Always specify permission requirements
- ❌ **Poor Error Handling**: Don't expose internal errors to users
- ❌ **Hardcoded Configuration**: Use environment variables for all config
- ❌ **Missing Validation**: Always validate input data
- ❌ **Poor Migration Management**: Don't create conflicting migrations
- ❌ **Insecure Authentication**: Don't bypass authentication checks
- ❌ **Missing Logging**: Always log errors for debugging
- ❌ **Poor API Response Structure**: Use consistent response formats

## 📚 File Organization

### Component Structure
```
src/
├── components/
│   ├── authScreens/          # Authentication pages
│   ├── buttons/              # Reusable button components
│   ├── layout/               # Header, sidebar, wrapper
│   ├── mainScreens/          # Main application pages
│   │   ├── dashbaordComponents/    # Dashboard tables
│   │   ├── restaurantsInformation/ # Onboarding workflow
│   │   └── summaryDashboard/       # Summary views
│   └── onBoarding/           # Onboarding components
├── store/                    # Zustand state management
├── utils/                    # Utility functions
└── routes/                   # Route definitions
```

### Naming Conventions
- **Components**: PascalCase (e.g., `SalesDataModal.jsx`)
- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase (e.g., `handleInputChange`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

## 🧪 Testing & Quality

### Frontend Development Workflow
1. **Build Check**: Always run `npm run build` before committing
2. **Linting**: Ensure no ESLint errors
3. **Responsive Testing**: Test on multiple screen sizes
4. **User Flow Testing**: Verify complete user journeys

### Frontend Common Issues to Check
- **Layout Stability**: Ensure no column shifting
- **Button Consistency**: Verify all buttons follow styling standards
- **Form Validation**: Test required field validation
- **Error Handling**: Verify graceful error display
- **Mobile Experience**: Check responsive behavior

### Backend Development Workflow
1. **Django Check**: Run `python manage.py check` before committing
2. **Migration Validation**: Ensure migrations are valid and don't conflict
3. **API Testing**: Test all endpoints with proper authentication
4. **Error Handling**: Verify graceful error responses
5. **Security Check**: Ensure proper permission classes are set

### Backend Common Issues to Check
- **Permission Classes**: Verify all views have proper permissions
- **Input Validation**: Test with invalid/malicious input data
- **Authentication**: Ensure protected endpoints require login
- **Error Responses**: Verify consistent error message format
- **Database Integrity**: Check for proper foreign key relationships
- **Migration Dependencies**: Ensure migration order is correct

## 🔄 Update & Maintenance

### When Adding New Features
1. **Follow Existing Patterns**: Use established component structures
2. **Maintain Consistency**: Apply established styling conventions
3. **Update This Guide**: Document any new patterns or standards
4. **Test Thoroughly**: Ensure no regression in existing functionality

### When Modifying Existing Features
1. **Preserve Functionality**: Don't break existing user flows
2. **Maintain Styling**: Keep consistent with established design
3. **Update Documentation**: Reflect changes in this guide
4. **Test Integration**: Ensure changes work with related components

---

## 📝 Quick Reference

### Button Classes
- **Primary**: `bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold`
- **Secondary**: `bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg`
- **Danger**: `bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg`

### Spacing Classes
- **Section Gap**: `gap-6` or `gap-8`
- **Form Spacing**: `mt-4` or `mt-6`
- **Card Padding**: `p-6`
- **Button Margin**: `mt-8 pt-6`

### Color Classes
- **Primary**: `text-orange-500`, `bg-orange-500`
- **Success**: `text-green-600`, `bg-green-100`
- **Error**: `text-red-600`, `bg-red-100`
- **Info**: `text-blue-500`, `bg-blue-100`

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Development Team

*This guide should be updated whenever new patterns or standards are established in the Growlio application.*
