import { Icon, Progress } from '../../components/primitives'
import { money } from '../../lib/money'
import type { AiBar, ChatMessage } from './useAssistant'
import styles from './assistant.module.css'

/* Barres de répartition d'une réponse — ILLUSTRATIVES (lecture seule). Fill par
   token catégorie (var(--cat-N)) pour rester cohérent avec le donut. */
function MessageBars({ bars, compact }: { bars: AiBar[]; compact: boolean }) {
  return (
    <div className={`c ${styles.bars}`}>
      {bars.map((b) => (
        <div key={b.label}>
          <div className={`r between ${styles.barHead}`}>
            <span className={styles.barLabel}>{b.label}</span>
            <span className="t-mono t-muted">
              {compact ? `${b.pct}%` : `${money(b.amount)} · ${b.pct}%`}
            </span>
          </div>
          <Progress pct={b.pct * 3.4} colorToken={b.colorToken} />
        </div>
      ))}
    </div>
  )
}

/** Fil de messages (`.chat`/`.msg`/`.bubble`/`.ai-av`) + bulle de chargement. */
export function MessageList({
  messages,
  isPending,
  compact = false,
}: {
  messages: ChatMessage[]
  isPending: boolean
  compact?: boolean
}) {
  return (
    <div className="chat">
      {messages.map((m, i) => (
        <div className={`msg ${m.role === 'user' ? 'u' : 'ai'} ${compact ? styles.msgSm : ''}`} key={i}>
          {m.role === 'assistant' && <div className={`ai-av ${compact ? styles.avSm : ''}`}>C</div>}
          <div className={`bubble ${compact ? styles.bubbleSm : ''}`}>
            {m.content}
            {m.bars && m.bars.length > 0 && <MessageBars bars={m.bars} compact={compact} />}
          </div>
        </div>
      ))}
      {isPending && (
        <div className={`msg ai ${compact ? styles.msgSm : ''}`} aria-live="polite">
          <div className={`ai-av ${compact ? styles.avSm : ''}`}>C</div>
          <div className={`bubble ${compact ? styles.bubbleSm : ''}`}>
            <span className={styles.typing} aria-label="L’assistant rédige une réponse">
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Chips de suggestions cliquables → envoient la question. */
export function SuggestionChips({
  items,
  onPick,
  disabled,
  compact = false,
}: {
  items: readonly string[]
  onPick: (q: string) => void
  disabled: boolean
  compact?: boolean
}) {
  return (
    <div className={`r ${styles.chips}`}>
      {items.map((s) => (
        <button
          key={s}
          type="button"
          className={`chip ${styles.chipBtn} ${compact ? styles.chipSm : styles.chipMd}`}
          onClick={() => onPick(s)}
          disabled={disabled}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

/** Champ de saisie `.ask` — input réel + bouton envoyer. Soumission = onSubmit(input). */
export function Composer({
  input,
  setInput,
  onSubmit,
  disabled,
  placeholder,
  compact = false,
}: {
  input: string
  setInput: (v: string) => void
  onSubmit: (text: string) => void
  disabled: boolean
  placeholder: string
  compact?: boolean
}) {
  return (
    <form
      className={`ask ${compact ? styles.askSm : ''}`}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(input)
      }}
    >
      <Icon name="message" size={compact ? 16 : 17} />
      <input
        className={styles.askInput}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        aria-label="Votre question"
        disabled={disabled}
      />
      <button
        type="submit"
        className={`icon-btn ${compact ? styles.sendSm : styles.send}`}
        disabled={disabled || !input.trim()}
        aria-label="Envoyer"
      >
        <Icon name="send" size={compact ? 15 : 16} />
      </button>
    </form>
  )
}
