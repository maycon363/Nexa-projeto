// Lista de novidades do app. O item mais NOVO fica no TOPO do array.
// Cada entrada precisa de um "id" único — é ele que decide se a pessoa já viu
// ou não essa novidade (comparado com o que fica salvo no navegador dela).
// Pra anunciar uma atualização nova: adiciona um objeto novo no topo, com um
// id diferente de todos os anteriores (ex: incrementa o número).

export const CHANGELOG = [
  {
    id: 4,
    date: '2026-08-21',
    title: 'Assistente mais inteligente',
    items: [
      'A IA agora enxerga a tela de Mapeamento e dá feedback específico sobre seus hábitos, citando nomes e números reais.',
      'Respostas mais analíticas quando você pergunta "como estou indo" ou pede um feedback sincero.'
    ]
  },
  {
    id: 3,
    date: '2026-08-21',
    title: 'Nova tela: Mapeamento de hábitos',
    items: [
      'Cada hábito de rotina agora tem uma avaliação de consistência dos últimos 30 dias, com sequência de dias seguidos e feedback qualitativo.'
    ]
  },
  {
    id: 2,
    date: '2026-08-21',
    title: 'Assistente trocou de motor',
    items: [
      'O assistente de IA agora roda em uma infraestrutura diferente por trás dos panos, mais estável no dia a dia.'
    ]
  },
  {
    id: 1,
    date: '2026-08-01',
    title: 'Lembretes e subtarefas',
    items: [
      'Itens de rotina agora podem ter um horário com notificação push, mesmo com o app fechado.',
      'Itens podem ser divididos em subtarefas menores, cada uma com seu próprio checkbox.'
    ]
  }
]

export function latestChangelogId() {
  return CHANGELOG[0]?.id ?? 0
}