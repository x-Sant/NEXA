// Enums
export enum Role {
  NIVEL_1 = 'NIVEL_1',
  NIVEL_2 = 'NIVEL_2',
  NIVEL_3 = 'NIVEL_3',
  PROFESSOR = 'PROFESSOR',
  CLIENTE = 'CLIENTE',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ContractStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SIGNED = 'SIGNED',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum DemandStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

export enum FinancialType {
  PAYABLE = 'PAYABLE',
  RECEIVABLE = 'RECEIVABLE',
}

export enum FinancialStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// Interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  cpfCnpj?: string;
  isActive: boolean;
  password?: string;
  passwordNeedsChange?: boolean;
  password_needs_change?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  deadline: string;
  status: ProjectStatus;
  ownerId: string;
  clientId?: string;
  client?: User;
  members?: ProjectMember[];
  demands?: Demand[];
  projectFiles?: ProjectFile[];
  contracts?: Contract[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  user?: User;
  projectId: string;
  assignedAt: string;
  productivity: number;
  progress: number;
}

export interface Demand {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  status: DemandStatus;
  projectId: string;
  project?: Project;
  files?: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectSubfolder = 'front' | 'back' | 'bd' | 'imgs' | 'git' | 'commits' | 'zip' | 'referencias';

export interface ProjectFile {
  id: string;
  projectId: string;
  subfolder: ProjectSubfolder;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  title: string;
  content: string;
  contentHash?: string;
  status: ContractStatus;
  signatures?: ContractSignature[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractSignature {
  id: string;
  contractId: string;
  userId: string;
  user?: User;
  signatureImage?: string;
  ipAddress: string;
  contentHash: string;
  signedAt: string;
}

export interface Ticket {
  id: string;
  projectId?: string;
  project?: Project;
  creatorId: string;
  creator?: User;
  subject: string;
  description: string;
  status: TicketStatus;
  responses?: TicketResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  authorId: string;
  author?: User;
  message: string;
  content: string;
  createdAt: string;
  isStaff: boolean;
}

export interface FinancialEntry {
  id: string;
  type: FinancialType;
  description: string;
  amount: number;
  dueDate: string;
  status: FinancialStatus;
  category?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessorComment {
  id: string;
  targetId: string;
  target?: User;
  authorId: string;
  author?: User;
  comment: string;
  createdAt: string;
}

export interface ProfitabilityGoal {
  id: string;
  userId: string;
  user?: User;
  month: string;
  target: number;
  actual: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCollaborators: number;
  totalClients: number;
  openTickets: number;
  pendingContracts: number;
  revenue: number;
  expenses: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  badge?: number;
}

export interface Delivery {
  id: string;
  projectId: string;
  demandId?: string;
  userId: string;
  description: string;
  imageUrl?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED';
  rating?: number;
  ratingComment?: string;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface Notification {
  id: string;
  type: 'ticket' | 'delivery' | 'contract' | 'comment';
  message: string;
  targetRole: string[];
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  description: string;
  createdAt: string;
}
