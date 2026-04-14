import React, { ReactNode } from 'react';

interface ModalProps {
  show: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  size?: 'sm' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  show, 
  title, 
  onClose, 
  children, 
  footer,
  onSubmit,
  isSubmitting = false,
  size
}) => {
  if (!show) return null;

  const content = (
    <div className="modal-content shadow">
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close no-drag" onClick={onClose} disabled={isSubmitting}></button>
      </div>
      {onSubmit ? (
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {children}
          </div>
          {footer && <div className="modal-footer">{footer}</div>}
        </form>
      ) : (
        <>
          <div className="modal-body">
            {children}
          </div>
          {footer && <div className="modal-footer">{footer}</div>}
        </>
      )}
    </div>
  );

  return (
    <>
      <div 
        className="modal fade show d-block" 
        tabIndex={-1} 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) onClose();
        }}
      >
        <div className={`modal-dialog modal-dialog-centered ${size ? `modal-${size}` : ''}`}>
          {content}
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default Modal;
