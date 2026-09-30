'use client'

// Reglas mágicas: el sistema de "bloques" estilo Scratch pero con frases.
// CUANDO [mascota] [se acerque a / sea acariciada / cada X s] → ENTONCES
// [Aumenta/Reduce] [estadística] [cantidad]

import { useStudio } from '@/lib/studio/store'
import { STATS, STAT_KEYS, catalogById } from '@/lib/studio/catalog'
import { Rule, TriggerType } from '@/lib/studio/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function PillSelect({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  ariaLabel?: string
}) {
  // si el objeto referenciado ya no existe, mostramos "cualquiera"
  const valid = options.some((o) => o.value === value) ? value : options[0]?.value ?? ''
  return (
    <select
      value={valid}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        'cursor-pointer appearance-none rounded-full border-2 border-black/5 px-2.5 py-1.5 text-xs font-bold shadow-sm transition-all hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 sm:text-sm',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

const pillWhen = 'bg-violet-100 text-violet-700'
const pillWhenLight = 'bg-violet-50 text-violet-700'
const pillThen = 'bg-amber-100 text-amber-700'
const pillThenLight = 'bg-amber-50 text-amber-700'

function RuleCard({ rule }: { rule: Rule }) {
  const objects = useStudio((s) => s.objects)
  const updateRule = useStudio((s) => s.updateRule)
  const removeRule = useStudio((s) => s.removeRule)

  const pets = objects.filter((o) => catalogById[o.catalogId]?.kind === 'pet')
  const props = objects.filter((o) => catalogById[o.catalogId]?.kind !== 'pet')

  const petOptions = [
    { value: 'cualquiera', label: '🐾 cualquier mascota' },
    ...pets.map((p) => ({
      value: p.id,
      label: `${catalogById[p.catalogId]?.emoji ?? '🐾'} ${p.name}`,
    })),
  ]
  const targetOptions = [
    { value: 'cualquiera', label: '🌈 cualquier objeto' },
    ...props.map((o) => ({
      value: o.id,
      label: `${catalogById[o.catalogId]?.emoji ?? '📦'} ${o.name}`,
    })),
  ]
  const triggerOptions: { value: TriggerType; label: string }[] = [
    { value: 'cerca', label: '🐾 se acerque a…' },
    { value: 'acariciar', label: '🤗 la acaricies' },
    { value: 'cada', label: '⏰ cada…' },
  ]
  const statOptions = STAT_KEYS.map((k) => ({
    value: k,
    label: `${STATS[k].emoji} ${STATS[k].label}`,
  }))
  const effectOptions = [
    { value: 'aumentar', label: '⬆️ Aumenta' },
    { value: 'reducir', label: '⬇️ Reduce' },
  ]
  const amountOptions = [5, 10, 15, 20, 25, 30].map((n) => ({
    value: String(n),
    label: `${rule.effect === 'aumentar' ? '+' : '−'}${n}`,
  }))
  const intervalOptions = [
    { value: '10', label: '10 segundos' },
    { value: '20', label: '20 segundos' },
    { value: '30', label: '30 segundos' },
    { value: '60', label: '1 minuto' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border-2 border-violet-100 bg-white p-2.5 shadow-sm">
      {rule.trigger === 'cada' ? (
        <>
          <span className={cn('rounded-full px-3 py-1.5 text-xs font-black sm:text-sm', pillWhen)}>
            CADA
          </span>
          <PillSelect
            value={String(rule.intervalSec)}
            onChange={(v) => updateRule(rule.id, { intervalSec: Number(v) })}
            options={intervalOptions}
            className={pillWhenLight}
            ariaLabel="Intervalo"
          />
          <span className="font-black text-slate-300">→</span>
          <span className={cn('rounded-full px-3 py-1.5 text-xs font-black sm:text-sm', pillThen)}>
            ENTONCES
          </span>
        </>
      ) : (
        <>
          <span className={cn('rounded-full px-3 py-1.5 text-xs font-black sm:text-sm', pillWhen)}>
            CUANDO
          </span>
          <PillSelect
            value={rule.petId}
            onChange={(v) => updateRule(rule.id, { petId: v })}
            options={petOptions}
            className={pillWhenLight}
            ariaLabel="Mascota"
          />
          <PillSelect
            value={rule.trigger}
            onChange={(v) => updateRule(rule.id, { trigger: v as TriggerType })}
            options={triggerOptions}
            className={pillWhen}
            ariaLabel="Evento"
          />
          {rule.trigger === 'cerca' && (
            <PillSelect
              value={rule.targetId}
              onChange={(v) => updateRule(rule.id, { targetId: v })}
              options={targetOptions}
              className={pillWhenLight}
              ariaLabel="Objeto"
            />
          )}
          <span className="font-black text-slate-300">→</span>
          <span className={cn('rounded-full px-3 py-1.5 text-xs font-black sm:text-sm', pillThen)}>
            ENTONCES
          </span>
        </>
      )}
      <PillSelect
        value={rule.effect}
        onChange={(v) => updateRule(rule.id, { effect: v as Rule['effect'] })}
        options={effectOptions}
        className={pillThenLight}
        ariaLabel="Efecto"
      />
      <PillSelect
        value={rule.stat}
        onChange={(v) => updateRule(rule.id, { stat: v as Rule['stat'] })}
        options={statOptions}
        className={pillThenLight}
        ariaLabel="Estadística"
      />
      <PillSelect
        value={String(rule.amount)}
        onChange={(v) => updateRule(rule.id, { amount: Number(v) })}
        options={amountOptions}
        className="bg-emerald-100 text-emerald-700"
        ariaLabel="Cantidad"
      />
      {rule.trigger === 'cada' && (
        <>
          <span className="text-xs font-bold text-slate-400">a</span>
          <PillSelect
            value={rule.petId}
            onChange={(v) => updateRule(rule.id, { petId: v })}
            options={petOptions}
            className={pillThenLight}
            ariaLabel="Mascota afectada"
          />
        </>
      )}
      <button
        onClick={() => removeRule(rule.id)}
        className="ml-auto rounded-full px-2 py-1 text-sm transition-colors hover:bg-rose-50"
        aria-label="Borrar regla"
        title="Borrar regla"
      >
        ✖️
      </button>
    </div>
  )
}

export function RulesPanel() {
  const mode = useStudio((s) => s.mode)
  const rules = useStudio((s) => s.rules)
  const addRule = useStudio((s) => s.addRule)

  if (mode !== 'edit') return null

  return (
    <section
      className="shrink-0 px-3 pb-3"
      aria-label="Reglas mágicas"
    >
      <div className="thin-scroll max-h-[34vh] overflow-y-auto rounded-3xl border-2 border-violet-100 bg-violet-50/60 p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-black tracking-wide text-violet-700">
            🧩 REGLAS MÁGICAS
          </h2>
          <span className="hidden text-xs font-bold text-violet-400 sm:inline">
            Se activan cuando pulsas ▶️ JUGAR
          </span>
          <Button
            onClick={addRule}
            className="ml-auto rounded-full bg-violet-500 font-black text-white shadow-md shadow-violet-200 transition-transform hover:bg-violet-600 active:scale-95"
          >
            ✨ Nueva regla
          </Button>
        </div>
        {rules.length === 0 ? (
          <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-violet-400">
            Aún no hay reglas. ¡Pulsa <b>✨ Nueva regla</b> y crea la primera! Por ejemplo:{' '}
            <i>Cuando 🐶 Max se acerque a 🥣 Comedero → Aumenta ❤️ Felicidad +10</i>
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
