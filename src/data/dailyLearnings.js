
export const DAILY_LEARNINGS = [
  {
    title: 'Comece pelo menor passo possível',
    body: 'Quando um hábito parece grande demais pra começar, encolha ele até ficar ridiculamente fácil (ex: "ler 1 página" em vez de "ler um livro"). O objetivo no início é criar o hábito de começar, não terminar.'
  },
  {
    title: 'Identidade antes de resultado',
    body: 'Trocar "quero ler mais" por "sou uma pessoa que lê" muda a motivação: você não está tentando alcançar uma meta, está confirmando quem você já decidiu ser. Cada item marcado aqui é um voto nessa identidade.'
  },
  {
    title: 'Não quebre a corrente duas vezes seguidas',
    body: 'Falhar um dia é normal e não desfaz o progresso. Falhar dois dias seguidos é o que costuma virar padrão novo. Se pulou ontem, o único compromisso de hoje é não pular de novo.'
  },
  {
    title: 'Ambiente vence força de vontade',
    body: 'É mais fácil desenhar o ambiente a seu favor (deixar o livro em cima do travesseiro, tirar o app de rede social da tela inicial) do que confiar em disciplina pura todo santo dia.'
  },
  {
    title: 'Empatia é uma escolha antes de ser um sentimento',
    body: 'Nem sempre dá pra sentir empatia automaticamente. Mas dá pra escolher agir como se sentisse: ouvir até o fim, perguntar antes de concluir. O sentimento geralmente vem depois da ação, não antes.'
  },
  {
    title: 'Revise seus valores de vez em quando',
    body: 'Valores que você define uma vez e nunca mais olha viram decoração. Reserva um momento por semana pra perguntar: isso aqui ainda faz sentido pra mim, ou eu só coloquei porque parecia certo na época?'
  },
  {
    title: 'Registrar é diferente de julgar',
    body: 'Marcar um dia ruim no histórico não é se autopunir, é só ter dado antes de decidir mudar algo. Sem o registro honesto, toda mudança de rotina vira achismo.'
  },
  {
    title: 'Disciplina é sobre o momento depois da vontade acabar',
    body: 'Todo mundo consegue fazer algo enquanto está com vontade. Disciplina é continuar quando a vontade já foi embora e ainda falta terminar.'
  },
  {
    title: 'Gratidão específica pesa mais que gratidão genérica',
    body: '"Sou grato pela minha família" pesa menos do que "sou grato porque minha irmã me ligou hoje sem motivo". Quanto mais específico o motivo, mais o cérebro registra o hábito de perceber coisas boas.'
  },
  {
    title: 'Autocontrole cansa como um músculo',
    body: 'Depois de um dia inteiro resistindo a impulsos (no trabalho, no trânsito, em conversas difíceis), sobra menos "combustível" pra resistir à noite. Se puder, faça o que exige mais controle mais cedo no dia.'
  }
]

export function getTodayLearning() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  )
  const index = dayOfYear % DAILY_LEARNINGS.length
  return { ...DAILY_LEARNINGS[index], index }
}