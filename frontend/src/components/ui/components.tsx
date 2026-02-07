// Composants UI Réutilisables - Design System CLOUD_MADIO
// Placer dans frontend/src/components/ui/

import type { ReactNode } from 'react';
import styles from './Button.module.css';

// ============================================
// BUTTONS
// ============================================

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button'
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Chargement...' : children}
    </button>
  );
};

// ============================================
// STATUS BADGE
// ============================================

type BadgeVariant = 'new' | 'inProgress' | 'completed' | 'success' | 'warning' | 'error';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export const Badge = ({ variant, children }: BadgeProps) => {
  const classMap: Record<BadgeVariant, string> = {
    new: styles.badgeNew,
    inProgress: styles.badgeInProgress,
    completed: styles.badgeCompleted,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    error: styles.badgeError,
  };

  return (
    <span className={`${styles.badge} ${classMap[variant]}`}>
      {children}
    </span>
  );
};

// ============================================
// CARD
// ============================================

interface CardProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card = ({ 
  title, 
  icon, 
  children, 
  onClick,
  hoverable = false 
}: CardProps) => {
  return (
    <div 
      className={`${styles.card} ${hoverable ? styles.hoverable : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {(title || icon) && (
        <div className={styles.cardHeader}>
          {icon && <div className={styles.cardIcon}>{icon}</div>}
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

// ============================================
// FORM INPUT
// ============================================

interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
}: InputProps) => {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

// ============================================
// SELECT
// ============================================

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export const Select = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  disabled = false,
}: SelectProps) => {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`${styles.select} ${error ? styles.selectError : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

// ============================================
// TEXTAREA
// ============================================

interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

export const Textarea = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  rows = 4,
}: TextareaProps) => {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

// ============================================
// MESSAGE ALERT
// ============================================

interface MessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  onClose?: () => void;
}

export const Message = ({ type, children, onClose }: MessageProps) => {
  return (
    <div className={`${styles.message} ${styles[`message${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
      <span>{children}</span>
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

// ============================================
// LOADING SPINNER
// ============================================

interface LoadingProps {
  text?: string;
}

export const Loading = ({ text = 'Chargement...' }: LoadingProps) => {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      {text && <p>{text}</p>}
    </div>
  );
};

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export const StatCard = ({ 
  title, 
  value, 
  icon,
  variant = 'primary'
}: StatCardProps) => {
  return (
    <div className={`${styles.statCard} ${styles[variant]}`}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>{title}</span>
        {icon && <div className={styles.statIcon}>{icon}</div>}
      </div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
};

// ============================================
// MODAL
// ============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer 
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
        {footer && (
          <div className={styles.modalFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ICÔNES SVG
// ============================================

export const Icons = {
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  
  Map: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
      <path d="M9 3v18M15 3v18" />
    </svg>
  ),
};

// ============================================
// EXEMPLES D'UTILISATION
// ============================================

/*
// Dans vos composants :

import { Button, Badge, Card, Input, Message, Icons } from '@/components/ui';

// Button
<Button variant="primary" onClick={handleClick}>
  Enregistrer
</Button>

// Badge
<Badge variant="completed">Terminé</Badge>

// Card
<Card title="Statistiques" icon={<Icons.Chart />}>
  <p>Contenu de la card</p>
</Card>

// Input
<Input 
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  required
/>

// Message
<Message type="success" onClose={() => setMessage(null)}>
  Opération réussie !
</Message>

// Icons
<Icons.User />
<Icons.Map />
<Icons.Settings />
*/
