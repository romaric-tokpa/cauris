import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { MessageList, SuggestionChips, Composer } from './ChatThread'
import { AiTabs } from './AiTabs'
import { SUGGESTIONS, type AssistantState } from './useAssistant'
import styles from './assistant.module.css'

interface Props extends AssistantState {
  className?: string
}

/** Écran Assistant desktop — porté 1:1 de AssistantDesk (screens-ai.jsx). */
export function AssistantDesktop({
  messages,
  input,
  setInput,
  submit,
  reset,
  isPending,
  className = '',
}: Props) {
  return (
    <div className={className}>
      {/* header */}
      <div className="r between">
        <div>
          <div className="t-eyebrow">IA · analyse sécurisée de vos finances</div>
          <div className={styles.pageTitle}>Assistant financier</div>
        </div>
        <button type="button" className="btn" onClick={reset}>
          <Icon name="plus" size={16} /> Nouvelle conversation
        </button>
      </div>

      {/* subnav (AISub) — Assistant actif ; Prévisions/Anomalies = liens ; Insights = dashboard */}
      <AiTabs active="Assistant" />

      <div className={styles.grid}>
        {/* colonne chat */}
        <Card className={`c ${styles.chatCard}`}>
          <MessageList messages={messages} isPending={isPending} />
          <SuggestionChips items={SUGGESTIONS.slice(0, 3)} onPick={submit} disabled={isPending} />
          <Composer
            input={input}
            setInput={setInput}
            onSubmit={submit}
            disabled={isPending}
            placeholder="Posez une question sur vos finances…"
          />
        </Card>

        {/* rail droit */}
        <div className={`c ${styles.rail}`}>
          <Card>
            <div className={`card-title ${styles.railTitle}`}>Questions fréquentes</div>
            <div className="c">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`row-line ${styles.qRow}`}
                  onClick={() => submit(s)}
                  disabled={isPending}
                >
                  <Icon name="message" size={15} className="t-faint" />
                  <span className={styles.qText}>{s}</span>
                  <Icon name="chevron" size={14} className="t-faint" />
                </button>
              ))}
            </div>
          </Card>

          <Card className={`r ${styles.privacy}`}>
            <div className={`row-ico ${styles.privacyIco}`}>
              <Icon name="shield" size={18} />
            </div>
            <div>
              <div className={styles.privacyTitle}>Confidentialité</div>
              <div className={`t-muted ${styles.privacyText}`}>
                Vos échanges sont traités côté serveur de façon sécurisée — la clé du modèle ne
                transite jamais par votre navigateur. L’assistant ne fait que suggérer : aucune
                opération n’est déclenchée sans votre validation.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
