import NexaMark from './NexaMark.jsx'

export default function AboutView() {
  return (
    <div>
      <section className="value-section">
        <div className="about-header">
          <NexaMark size={40} />
          <div>
            <h2 className="about-title">Nexa</h2>
            <p className="about-tagline">Rotina, valores e provas do dia a dia num só lugar.</p>
          </div>
        </div>

        <p className="about-p">
          O Nexa nasceu de um problema pessoal: eu queria acompanhar minha rotina e os
          valores que quero viver de verdade (empatia, disciplina, paciência...), mas
          listas de papel ou apps genéricos de hábito nunca davam conta de misturar as
          duas coisas como: "o que eu faço todo dia" e "quem eu quero ser". Cada checklist
          marcado aqui funciona como uma pequena <strong>prova</strong> de que aquele
          valor foi vivido naquele dia, não só uma tarefa riscada.
        </p>

        <p className="about-p">
          O app é dividido em três frentes: <strong>Hoje</strong> (rotina por período do
          dia + valores, dia a dia, sem misturar uma semana com a outra),
          <strong> Histórico</strong> (diagnóstico de quais valores você mais/menos vive,
          com base nos últimos dias) e <strong>Valores</strong> (gerenciar o que existe).
        </p>
      </section>

      <section className="value-section">
        <h3 className="about-subtitle">O papel da IA</h3>
        <p className="about-p">
          O assistente não está aqui só pra dar dica ou bater papo, ele existe pra
          <strong> economizar o tempo</strong> que você gastaria montando listas na mão.
          Em vez de criar item por item clicando, você pode pedir pra ele montar uma
          rotina inteira, criar um valor novo já com os itens de checklist, marcar ou
          desmarcar vários itens de uma vez, editar textos ou limpar o que não faz mais
          sentido, tudo numa frase. Dá uma olhada na aba <strong>Aprenda</strong> pra
          ver exemplos prontos.
        </p>
      </section>

      <section className="value-section">
        <h3 className="about-subtitle">Como foi construído</h3>
        <p className="about-p">
          Front-end em React + Vite, com um design system próprio (sem biblioteca de UI
          pronta). Login e dados salvos no Supabase (Postgres com Row Level Security,
          cada pessoa só acessa o que é dela). O assistente roda num modelo open-weight
          via Cerebras, atrás de uma função serverless que confere quem está chamando e
          controla um limite diário de mensagens por pessoa.
        </p>
      </section>
    </div>
  )
}