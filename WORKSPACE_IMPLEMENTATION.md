# Step 6: Workspace Collaboration Features - Implementation Complete

## Overview

The workspace collaboration feature extends the Neife legal platform with a secure, encrypted document management system that enables lawyers and clients to collaborate on legal documents with versioning and digital signature support.

## Features Implemented

### 1. **Document Management**
- Upload documents to a shared workspace per legal case
- Support for multiple document versions
- Document archiving (soft delete)
- Encrypted storage (AES-256-GCM)
- File size limit: 25 MB per document
- Supported formats: PDF, images (JPG/PNG/WebP), Word, plain text

### 2. **Digital Signatures**
- Sign document versions with encrypted signature files
- Track signature metadata (signer, role, timestamp)
- Download both original and signed versions
- Signature validation through separate encrypted file storage

### 3. **Collaboration Features**
- Both client and lawyer can upload and sign documents
- Real-time document visibility (respecting RLS)
- Activity logging for all document operations
- Email notifications on document uploads and signatures
- Document versioning with complete history

### 4. **Security**
- Row-level security (RLS) policies for all tables
- End-to-end encryption for stored documents
- Server-side encryption key management
- Storage access control via RLS and signed URLs
- Audit trail through case_activities table

## Database Schema

### New Tables

#### `case_documents`
- `id` (UUID): Primary key
- `case_id` (UUID): Reference to cases table
- `title` (text): Document name/title
- `description` (text, nullable): Optional description
- `archived` (boolean): Soft delete flag
- `created_at`, `updated_at` (timestamptz): Timestamps

#### `case_document_versions`
- `id` (UUID): Primary key
- `case_document_id` (UUID): Reference to case_documents
- `file_name` (text): Original filename
- `file_type` (text): MIME type
- `file_size` (text): File size in bytes
- `storage_path` (text): Path in Supabase Storage
- `version_number` (int): Sequential version counter
- `uploaded_by` (UUID): User ID of uploader
- `uploaded_by_role` (text): "client" or "lawyer"
- `signed_storage_path` (text, nullable): Path to signed version
- `signed_by` (UUID, nullable): User ID of signer
- `signed_by_role` (text, nullable): Role of signer
- `signed_at` (timestamptz, nullable): Signature timestamp
- `encrypted` (boolean): Encryption flag (always true)
- `created_at` (timestamptz): Creation timestamp

### Updated Tables

#### `case_activities`
No schema changes. New activity types added:
- `workspace_document_uploaded`: Document added to workspace
- `workspace_document_signed`: Document signed digitally
- `workspace_document_archived`: Document archived

#### Storage Policies (`03_storage.sql`)
Enhanced policies now include:
- Case-based access control for uploads
- Permission verification via cases table join
- Authenticated user requirement

## API Endpoints (Server Actions)

### `lib/actions/case-workspace.ts`

#### `uploadWorkspaceDocument(formData: FormData)`
Upload a new document or version to the workspace.

**Parameters:**
- `case_id`: ID of the legal case
- `file`: File to upload
- `title`: Document title (optional, defaults to filename)
- `description`: Document description (optional)
- `case_document_id`: Existing document ID to add version (optional)

**Returns:**
```typescript
{ success: true } | { error: string }
```

**Actions:**
- Creates or updates case_document record
- Encrypts and uploads file to storage
- Records case_document_version entry
- Logs case activity
- Sends email notification to other party

#### `uploadWorkspaceDocumentSignature(formData: FormData)`
Digitally sign a document version.

**Parameters:**
- `version_id`: ID of the document version
- `file`: Signature file to upload

**Returns:**
```typescript
{ success: true } | { error: string }
```

**Actions:**
- Encrypts and uploads signature file
- Updates version record with signature metadata
- Logs case activity
- Sends email notification

#### `archiveWorkspaceDocument(documentId: string)`
Archive (soft delete) a document.

**Parameters:**
- `documentId`: ID of document to archive

**Returns:**
```typescript
{ success: true } | { error: string }
```

**Actions:**
- Sets archived flag to true
- Logs case activity
- Does not delete underlying versions

#### `downloadWorkspaceDocument(storagePath: string)`
Download and decrypt a document file.

**Parameters:**
- `storagePath`: Path to encrypted file in storage

**Returns:**
```typescript
{ dataUrl: string, fileName: string, mimeType: string } | { error: string }
```

**Process:**
- Verifies user access (case participant)
- Downloads encrypted file from storage
- Decrypts using server-side key
- Returns base64 data URL for browser download

## UI Components

### `components/case-workspace/CaseWorkspaceClient.tsx`

A client component providing the workspace interface with:

**Sections:**
1. **Workspace Overview** - Statistics (documents, versions, archived)
2. **New Document Upload** - Form to add documents and versions
3. **Document List** - All documents with version history
4. **Document Actions** - Download, sign, version, archive controls

**Features:**
- Real-time document loading
- Version history display
- Signature status tracking
- Download functionality
- Error handling and user feedback

### Routes

#### `/dashboard-client/cases/[caseId]/workspace`
Client view of case workspace
- Page: `app/dashboard-client/cases/[caseId]/workspace/page.tsx`

#### `/dashboard-lawyer/cases/[caseId]/workspace`
Lawyer view of case workspace
- Page: `app/dashboard-lawyer/cases/[caseId]/workspace/page.tsx`

**Both routes:**
- Pass `basePath` for back navigation
- Use shared `CaseWorkspaceClient` component
- Respect RLS for document visibility

## Navigation Links

Added workspace links to existing case views:

### Client Cases Page
- Workspace link: "Ir al workspace"
- Location: Case detail header

### Lawyer Cases Page
- Workspace link: "Ver workspace"
- Location: Case detail header

## Deployment Instructions

### 1. Run Database Migration
```bash
# Execute the migration in Supabase SQL Editor or via psql:
cat supabase/07_workspace_documents.sql | psql $DATABASE_URL

# Or use Supabase CLI:
supabase db push
```

### 2. Update RLS Policies
Ensure `supabase/02_rls.sql` has been applied with the new workspace RLS policies.

### 3. Update Storage Policies
Ensure `supabase/03_storage.sql` has been applied with enhanced storage access rules.

### 4. Deploy Application
```bash
# Build to verify compilation
npm run build

# Deploy (method depends on hosting platform)
# Example for Vercel:
vercel deploy --prod
```

### 5. Verify Deployment
- Login as client and lawyer
- Create a test case
- Navigate to workspace route
- Test document upload
- Test document signing
- Check email notifications (if configured)

## Environment Variables

Ensure these are set in `.env` or `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key

# For server operations (migrations, admin tasks)
DATABASE_URL=postgresql://user:pass@host/db
DIRECT_URL=postgresql://user:pass@host/db

# Email notifications
RESEND_API_KEY=your-resend-key
RESEND_FROM=Neife <onboarding@resend.dev>
```

## Encryption

### Key Management
- Uses `lib/encryption.ts` (AES-256-GCM)
- Server-side encryption key from environment
- Never transmitted to client
- Client receives decrypted base64 data URLs only

### Files Encrypted
- Document content in storage
- Signature files in storage
- Metadata remains in database (unencrypted)

## Security Considerations

1. **Access Control**: All document access verified through RLS policies
2. **File Validation**: Whitelist of allowed MIME types
3. **Size Limits**: 25 MB maximum per file
4. **Encryption**: AES-256-GCM for all stored content
5. **Audit Trail**: All operations logged to case_activities
6. **Email Notifications**: Configurable via `RESEND_API_KEY`

## Testing Checklist

- [ ] Client can upload documents
- [ ] Lawyer can upload documents
- [ ] Document versions increment correctly
- [ ] Both parties see all documents (respecting RLS)
- [ ] Documents can be downloaded and decrypted
- [ ] Documents can be signed
- [ ] Signed versions are stored separately
- [ ] Documents can be archived
- [ ] Email notifications are sent
- [ ] Case activities are logged
- [ ] Build succeeds without errors
- [ ] No console errors in browser

## Troubleshooting

### Documents not visible
- Check RLS policies in Supabase
- Verify user is case participant (client_id or lawyer_id)
- Check case_documents.case_id matches

### Download fails
- Verify encryption key in environment
- Check storage_path exists in storage
- Verify user has access to case

### Email not sent
- Check RESEND_API_KEY is set
- Verify recipient email exists
- Check Resend account status

### Build errors
- Clear `.next` and `node_modules`
- Run `npm run build` again
- Check for TypeScript errors with `npm run lint`

## Future Enhancements

- Document templates
- Bulk upload
- OCR for image documents
- Document search/tagging
- Workflow approvals
- Watermarking
- Audit log export

## References

- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase RLS: https://supabase.com/docs/guides/row-level-security
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- Encryption Implementation: `lib/encryption.ts`

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready
