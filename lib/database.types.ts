// Database types matching Supabase schema

export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'waitlisted';
export type InternshipTrack = 'web-development' | 'fullstack-ai';
export type DocumentType = 'acceptance' | 'onboarding' | 'completion' | 'recommendation';
export type CertificateStatus = 'active' | 'revoked';
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

export interface Student {
  id: string;
  application_id: string;
  student_code: string;
  batch_name: string;
  attendance_percentage: number;
  project_submitted: boolean;
  project_score: number;
  certificate_eligible: boolean;
  joined_at: string;
  updated_at: string;
  // Joined fields
  application?: Application;
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
  certificate_id: string;
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
  background_url: string | null;
  fields: CertificateTemplateField[];
  width: number;
  height: number;
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
        Insert: Omit<Student, 'id' | 'joined_at' | 'updated_at' | 'attendance_percentage' | 'project_submitted' | 'project_score' | 'certificate_eligible'> & {
          id?: string;
          joined_at?: string;
          updated_at?: string;
          attendance_percentage?: number;
          project_submitted?: boolean;
          project_score?: number;
          certificate_eligible?: boolean;
        };
        Update: Partial<Student>;
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
        Insert: Omit<Certificate, 'id' | 'issued_at' | 'status'> & {
          id?: string;
          issued_at?: string;
          status?: CertificateStatus;
        };
        Update: Partial<Certificate>;
      };
      certificate_templates: {
        Row: CertificateTemplate;
        Insert: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CertificateTemplate>;
      };
    };
  };
}
