# 🚀 Regent Connect - Setup Guide

## Access the Application

### Method 1: Direct URL (Spaces in URL)
```
http://localhost/Regent%20Connect/public/index.html
```

### Method 2: With Redirect (Create index.php in root)
```
http://localhost/Regent%20Connect/
```

### Method 3: Rename Folder (Remove Space)
1. Rename folder to `Regent-Connect` (without space)
2. Access via: `http://localhost/Regent-Connect/public/index.html`

## File Structure

```
C:\xampp\htdocs\Regent Connect\
├── index.php (redirect to public/)
├── SETUP.md (this file)
├── README.md
├── PROJECT_COMPLETE.md
└── public\
    ├── index.html ← START HERE
    ├── login.html
    ├── dashboard.html
    ├── chat.html
    ├── groups.html
    ├── profile.html
    ├── friends.html
    ├── status.html
    ├── call.html
    ├── ai.html
    ├── settings.html
    ├── notifications.html
    ├── link-checker.html ← TEST TOOL
    ├── css\
    ├── js\
    └── components\
```

## Quick Test

1. Start XAMPP Apache
2. Open browser
3. Go to: `http://localhost/Regent%20Connect/public/index.html`
4. Test links with: `http://localhost/Regent%20Connect/public/link-checker.html`

## All Working URLs

- Index: `http://localhost/Regent%20Connect/public/index.html`
- Login: `http://localhost/Regent%20Connect/public/login.html`
- Dashboard: `http://localhost/Regent%20Connect/public/dashboard.html`
- Chat: `http://localhost/Regent%20Connect/public/chat.html`
- Groups: `http://localhost/Regent%20Connect/public/groups.html`
- Profile: `http://localhost/Regent%20Connect/public/profile.html`
- Friends: `http://localhost/Regent%20Connect/public/friends.html`
- Status: `http://localhost/Regent%20Connect/public/status.html`
- Call: `http://localhost/Regent%20Connect/public/call.html`
- AI: `http://localhost/Regent%20Connect/public/ai.html`
- Settings: `http://localhost/Regent%20Connect/public/settings.html`
- Notifications: `http://localhost/Regent%20Connect/public/notifications.html`

## Troubleshooting

### Issue: "Not Found" Error
**Solution**: URL-encode spaces as `%20`

### Issue: CSS Not Loading
**Solution**: Check paths in HTML files start with `./css/`

### Issue: JavaScript Modules Not Working
**Solution**: Check scripts load in order: db.js → auth.js → users.js → etc.

### Issue: Can't Access from Root URL
**Solution**: Create `index.php` redirect file in root directory

## Demo Credentials

- Username: `Philip` or `Nana` or `Akosua`
- Password: `demo123`
- Or register a new account!

## Need Help?

Run the link checker:
```
http://localhost/Regent%20Connect/public/link-checker.html
```

This will test all files and show their status.
