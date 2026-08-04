import NexaMark from './NexaMark.jsx'
import { BellIcon } from './Icons.jsx'

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

      <section className="value-section update-highlight">
        <div className="update-highlight-head">
          <span className="update-highlight-icon"><BellIcon size={18} /></span>
          <div>
            <span className="update-eyebrow">Novidade</span>
            <h3 className="about-subtitle" style={{ margin: '2px 0 0' }}>Lembretes por notificação</h3>
          </div>
        </div>
        <p className="about-p">
          Agora dá pra colocar um <strong>horário</strong> em qualquer item da rotina
          (na aba Hoje, junto do item) e receber uma notificação na hora certa,
          mesmo com o app fechado. É útil pra rotina que depende de lembrança, tipo
          "tomar remédio às 8h" ou "10min sem celular às 22h30".
        </p>
        <p className="about-p">
          Pra ativar, vai no rodapé do app e toca em <strong>"Ativar lembretes"</strong>.
          O navegador vai pedir permissão de notificação, aceitando, o Nexa passa a
          avisar você direto pelo sistema, sem precisar estar com o app aberto.
        </p>
        <p className="about-p">
          <strong>No iPhone</strong> tem um passo a mais: o iOS só entrega notificação
          pra apps "instalados" na tela de início, não pelo Safari aberto direto. Se
          você usa iPhone, vai aparecer um aviso ensinando a instalar (Compartilhar →
          Adicionar à Tela de Início) depois disso os lembretes funcionam normalmente,
          igual um app nativo.
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
          sentido, tudo numa frase. Ele também consegue colocar horário de lembrete
          direto pelo chat, se você pedir (ex: "adiciona ler livro às 21h"). Dá uma
          olhada na aba <strong>Aprenda</strong> pra ver exemplos prontos.
        </p>
      </section>

      <section className="value-section">
        <h3 className="about-subtitle">Como foi construído</h3>
        <p className="about-p">
          Front-end em React + Vite, com um design system próprio (sem biblioteca de UI
          pronta). Login e dados salvos no Supabase (Postgres com Row Level Security,
          cada pessoa só acessa o que é dela). O assistente roda num modelo open-weight
          via Cerebras, atrás de uma função serverless que confere quem está chamando e
          controla um limite diário de mensagens por pessoa. Os lembretes usam Web Push
          com service worker, e o app pode ser instalado na tela de início (PWA) tanto
          no Android quanto no iPhone.
        </p>
      </section>
    </div>
  )
}