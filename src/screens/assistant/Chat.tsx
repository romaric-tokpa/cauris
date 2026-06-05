import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { DETERMINISTIC_LABEL } from '../../lib/coachReformulate'
import { AiTabs } from './AiTabs'
import { Composer, SuggestionChips, MessageBars } from './ChatThread'
import { SUGGESTIONS } from './useAssistant'
import { useChat, type ChatMsg } from './useChat'
import styles from './assistant.module.css'

/**
 * Chat assistant (Lot D) — restauré À CÔTÉ de l'« Avis du coach » (onglet Chat). Les
 * questions sont ROUTÉES honnêtement (cf. `useChat`/`coachChat`) : verdict déterministe
 * du coach, donnée simple (stub ancré), ou aveu « je ne sais pas encore » + chips. Aucune
 * action financière déclenchée ; la mention « version démo » reste visible.
 */
export function Chat() {
  useSetPageTitle('Assistant')
  const { messages, input, setInput, submit, reset, isPending } = useChat()

  return (
    <>
      <h1 className={styles.srOnly}>Assistant — chat</h1>
      <div className={`r between ${styles.coachHead}`}>
        <div>
          <div className="t-eyebrow">IA · analyse sécurisée de vos finances</div>
          <div className={styles.pageTitle}>Assistant financier</div>
        </div>
        <button type="button" className="btn" onClick={reset}>
          <Icon name="plus" size={16} /> Nouvelle conversation
        </button>
      </div>
      <AiTabs active="Chat" />

      <Card className={`c ${styles.chatCard}`}>
        <div className="chat">
          {messages.map((m, i) => (
            <Bubble key={i} m={m} onChip={submit} />
          ))}
          {isPending && (
            <div className="msg ai" aria-live="polite">
              <div className="ai-av">C</div>
              <div className="bubble">
                <span className={styles.typing} aria-label="L’assistant rédige une réponse">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          )}
        </div>
        <SuggestionChips items={SUGGESTIONS.slice(0, 3)} onPick={submit} disabled={isPending} />
        <Composer
          input={input}
          setInput={setInput}
          onSubmit={submit}
          disabled={isPending}
          placeholder="Posez votre question…"
        />
      </Card>

      <Card className={`r ${styles.privacy}`}>
        <div className={`row-ico ${styles.privacyIco}`}>
          <Icon name="shield" size={18} />
        </div>
        <div>
          <div className={styles.privacyTitle}>Version démo · IA honnête</div>
          <div className={`t-muted ${styles.privacyText}`}>
            L’assistant s’appuie sur vos vraies données et ne déclenche aucune opération. Une
            question qu’il ne sait pas traiter est déclinée — jamais une réponse inventée.
          </div>
        </div>
      </Card>
    </>
  )
}

function Bubble({ m, onChip }: { m: ChatMsg; onChip: (q: string) => void }) {
  if (m.role === 'user') {
    return (
      <div className="msg u">
        <div className="bubble">{m.content}</div>
      </div>
    )
  }
  return (
    <div className="msg ai">
      <div className="ai-av">C</div>
      <div className="bubble">
        {m.content}
        {m.bars && m.bars.length > 0 && <MessageBars bars={m.bars} />}
        {m.coach && (
          <div className={styles.coachTag}>
            <span className="t-faint">{DETERMINISTIC_LABEL}</span>
            <Link to="/assistant-ia" className="card-link">
              Voir l’analyse complète <Icon name="chevron" size={13} />
            </Link>
          </div>
        )}
        {m.chips && (
          <div className={`r ${styles.fallbackChips}`}>
            {m.chips.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => onChip(c)}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
