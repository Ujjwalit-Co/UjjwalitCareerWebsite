// Database types matching Supabase schema

export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'waitlisted';
export type InternshipTrack = 'web-development' | 'fullstack-ai';
export type DocumentType = 'acceptance' | 'onboarding' | 'completion' | 'recommendation';
export type CertificateStatus = 'active' | 'revoked';
export type CertificateType = 'completion' | 'achievement' | 'participation';
export type StudentCertificateType = 'none' | CertificateType;
export type TemplateType = CertificateType | 'custom';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  college: string;
  branch: string;
  year: string;
  linkedin_url: string | null;
  github_url: string | null;
  internship_track: InternshipTrack;
  resume_url: string | null;
  application_status: ApplicationStatus;
  payment_status: PaymentStatus;
  payment_tx_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  slug: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementStatement {
  id: string;
  label: string;
  body_markdown: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentAchievementStatement {
  student_id: string;
  statement_id: string;
  display_order: number;
  created_at: string;
}

export interface Student {
  id: string;
  application_id: string;
  opportunity_id: string | null;
  profile_id: string | null;
  student_code: string;
  batch_name: string;
  attendance_percentage: number;
  project_submitted: boolean;
  project_score: number;
  certificate_eligible: boolean;
  certificate_type: StudentCertificateType;
  joined_at: string;
  updated_at: string;
  // Joined fields
  application?: Application;
  profile?: StudentProfile;
  achievement_statements?: AchievementStatement[];
}

export interface Document {
  id: string;
  student_id: string;
  document_type: DocumentType;
  document_url: string;
  generated_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  opportunity_id: string | null;
  template_id: string | null;
  certificate_id: string;
  certificate_type: CertificateType;
  verification_hash: string;
  qr_code_url: string | null;
  certificate_pdf_url: string | null;
  status: CertificateStatus;
  issued_at: string;
  // Joined fields
  student?: Student & { application?: Application };
}

export interface CertificateTemplateField {
  id: string;
  type: 'text' | 'qrcode' | 'image';
  label: string;
  placeholder: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface CertificateTemplate {
  id: string;
  name: string;
  template_type: TemplateType;
  description: string | null;
  background_url: string | null;
  fields: CertificateTemplateField[];
  width: number;
  height: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Database helper types for Supabase
export interface Database {
  public: {
    Tables: {
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'application_status' | 'payment_status' | 'payment_tx_id'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          application_status?: ApplicationStatus;
          payment_status?: PaymentStatus;
          payment_tx_id?: string | null;
        };
        Update: Partial<Application>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'joined_at' | 'updated_at' | 'attendance_percentage' | 'project_submitted' | 'project_score' | 'certificate_eligible' | 'certificate_type'> & {
          id?: string;
          joined_at?: string;
          updated_at?: string;
          attendance_percentage?: number;
          project_submitted?: boolean;
          project_score?: number;
          certificate_eligible?: boolean;
          certificate_type?: StudentCertificateType;
        };
        Update: Partial<Student>;
      };
      student_profiles: {
        Row: StudentProfile;
        Insert: Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StudentProfile>;
      };
      achievement_statements: {
        Row: AchievementStatement;
        Insert: Omit<AchievementStatement, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: Partial<AchievementStatement>;
      };
      student_achievement_statements: {
        Row: StudentAchievementStatement;
        Insert: Omit<StudentAchievementStatement, 'created_at' | 'display_order'> & {
          created_at?: string;
          display_order?: number;
        };
        Update: Partial<StudentAchievementStatement>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'generated_at'> & {
          id?: string;
          generated_at?: string;
        };
        Update: Partial<Document>;
      };
      certificates: {
        Row: Certificate;
        Insert: Omit<Certificate, 'id' | 'issued_at' | 'status' | 'certificate_type'> & {
          id?: string;
          issued_at?: string;
          status?: CertificateStatus;
          certificate_type?: CertificateType;
        };
        Update: Partial<Certificate>;
      };
      certificate_templates: {
        Row: CertificateTemplate;
        Insert: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at' | 'template_type'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          template_type?: TemplateType;
        };
        Update: Partial<CertificateTemplate>;
      };
    };
  };
}
