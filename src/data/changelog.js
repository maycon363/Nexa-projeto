// Lista de novidades do app. O item mais NOVO fica no TOPO do array.
// Cada entrada precisa de um "id" único — é ele que decide se a pessoa já viu
// ou não essa novidade (comparado com o que fica salvo no navegador dela).
// Pra anunciar uma atualização nova: adiciona um objeto novo no topo, com um
// id diferente de todos os anteriores (ex: incrementa o número).

export const CHANGELOG = [
  {
    id: 6,
    date: '2026-08-24',
    title: 'Assistente reconstruído por baixo dos panos',
    items: [
      'Trocamos o jeito da IA gerar ações por um sistema mais confiável (function calling nativo), ela agora executa cada ação (marcar, criar, editar, remover) de forma direta, em vez de escrever um texto que podia ficar desconectado do que realmente foi feito.',
      'Corrigido: pedir pra adicionar algo "em todos os dias da semana" agora funciona de primeira, sem precisar corrigir a IA no meio da conversa.',
      'Corrigido: itens de rotina criados pela IA não ficam mais "invisíveis" por causa de diferença de maiúscula/minúscula no período do dia.',
      'Confirmação visual ao apagar a conversa do chat, evita apagar sem querer.'
    ]
  },
  {
    id: 5,
    date: '2026-08-22',
    title: 'Ajustes finos: chat, atalhos e diagnóstico',
    items: [
      'Novo botão de lixeira no chat da IA, apaga o histórico da conversa quando você quiser começar do zero.',
      'O sino de Novidades saiu do rodapé e agora fica fixo no topo, ao lado do logo, sem precisar descer a tela pra ver o que mudou.',
      'Diagnóstico de valores no Histórico ficou mais sensível: agora reflete os últimos 7 dias em vez de 30, então cada item marcado tem um efeito bem mais visível na porcentagem.',
      'IA mais confiável em pedidos grandes ("marca tudo de hoje"): corrigido um problema em que respostas longas podiam ser cortadas no meio, fazendo a IA achar que tinha concluído sem ter concluído tudo.'
    ]
  },
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