import { useState, type InputHTMLAttributes } from 'react'
import { Icon } from '../../components/primitives'
import styles from './auth.module.css'

type FieldProps = { label: string } & InputHTMLAttributes<HTMLInputElement>

/** Champ texte — `.lbl` + `.inp` contenant un vrai `<input>` (cf. components.css). */
export function Field({ label, ...input }: FieldProps) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <div className="inp">
        <input {...input} />
      </div>
    </label>
  )
}

/** Champ mot de passe avec bascule afficher/masquer (icône œil). */
export function PasswordField({ label, ...input }: FieldProps) {
  const [show, setShow] = useState(false)
  return (
    <label>
      <span className="lbl">{label}</span>
      <div className="inp">
        <input type={show ? 'text' : 'password'} {...input} />
        <button
          type="button"
          className={styles.eyeBtn}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={show}
          onClick={() => setShow((s) => !s)}
        >
          <Icon name="eye" size={16} />
        </button>
      </div>
    </label>
  )
}

/** Bannière d'erreur soignée (ton négatif). */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="alert over" role="alert">
      <i className="swatch" />
      <div className={styles.alertText}>{message}</div>
    </div>
  )
}
