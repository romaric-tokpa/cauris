import { MessageList, SuggestionChips, Composer } from './ChatThread'
import { SUGGESTIONS, type AssistantState } from './useAssistant'

interface Props extends AssistantState {
  className?: string
}

/** Écran Assistant mobile — porté 1:1 de AssistantMob (chat + 2 chips + saisie). */
export function AssistantMobile({
  messages,
  input,
  setInput,
  submit,
  isPending,
  className = '',
}: Props) {
  return (
    <div className={className}>
      <MessageList messages={messages} isPending={isPending} compact />
      <SuggestionChips items={SUGGESTIONS.slice(0, 2)} onPick={submit} disabled={isPending} compact />
      <Composer
        input={input}
        setInput={setInput}
        onSubmit={submit}
        disabled={isPending}
        placeholder="Posez une question…"
        compact
      />
    </div>
  )
}
