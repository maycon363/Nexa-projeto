const VALUES = [
  {
    id: 'prestativo',
    name: 'Prestativo',
    description: '',
    items: [
      'Ajudar alguém sem ser pedido',
      'Oferecer apoio quando perceber dificuldade',
      'Ser útil no trabalho (proatividade)',
      'Ensinar/explicar com paciência',
      'Fazer uma gentileza prática (resolver algo simples)'
    ]
  },
  {
    id: 'empatia',
    name: 'Empatia',
    description: '',
    items: [
      'Ouvir sem interromper',
      'Tentar entender antes de responder',
      'Validar o sentimento do outro',
      'Falar com respeito mesmo discordando',
      'Me colocar no lugar da outra pessoa'
    ]
  },
  {
    id: 'paciencia',
    name: 'Paciência',
    description: '',
    items: [
      'Esperar resultados sem desistir',
      'Fazer uma coisa por vez (sem pressa)',
      'Aprender no seu ritmo',
      'Escutar até o fim',
      'Não exigir perfeição de si mesmo',
      'Aceitar que mudanças levam tempo',
      'Lidar com filas e atrasos sem irritação excessiva',
      'Treinar tolerância a erros (meus e dos outros)'
    ]
  },
  {
    id: 'respeito',
    name: 'Respeito',
    description: '',
    items: [
      'Cumprir sua palavra',
      'Tratar pessoas com educação',
      'Respeitar os próprios limites',
      'Respeitar relacionamentos dos outros',
      'Não humilhar ninguém',
      'Aceitar opiniões diferentes',
      'Pedir desculpas quando errar',
      'Cuidar do próprio corpo'
    ]
  },
  {
    id: 'autenticidade',
    name: 'Autenticidade',
    description: '',
    items: [
      'Ser eu mesmo',
      'Não criar personagens',
      'Admitir erros',
      'Ser sincero',
      'Não fingir saber tudo',
      'Falar a verdade',
      'Falar o que penso com respeito (sem agradar todo mundo)',
      'Aceitar minhas imperfeições',
      'Agir conforme meus valores',
      'Manter coerência entre falar e fazer'
    ]
  },
  {
    id: 'disciplina',
    name: 'Disciplina',
    description: '',
    items: [
      'Levantar no horário planejado',
      'Preparar a noite anterior (roupa/bolsa/agenda)',
      'Estudar no horário definido',
      'Fazer o que foi planejado mesmo sem vontade',
      'Organizar o quarto',
      'Arrumar a cama',
      'Terminar o que começou (sem largar pela metade)',
      'Não abandonar uma meta após um dia ruim'
    ]
  },
  {
    id: 'auto-controle',
    name: 'Auto controle',
    description: '',
    items: [
      'Não responder com raiva',
      'Respirar 10s antes de reagir',
      'Não gastar dinheiro por impulso',
      'Esperar 24h antes de comprar algo (quando der)',
      'Não comprar algo desnecessário',
      'Não ficar mexendo no celular durante o estudo',
      'Não interromper alguém falando',
      'Não agir por impulso quando não sentiu vontade'
    ]
  },
  {
    id: 'gratidao',
    name: 'Gratidão',
    description: '',
    items: [
      'Agradecer pelo dia',
      'Listar 3 coisas boas do dia',
      'Reconhecer pequenas conquistas',
      'Valorizar sua família',
      'Valorizar o emprego que tem hoje',
      'Reconhecer oportunidades recebidas',
      'Celebrar progressos pequenos',
      'Ser gentil com alguém (quando possível)'
    ]
  }
]

const values = VALUES.map(v => ({ id: v.id, name: v.name, description: v.description }))

const valorItems = VALUES.flatMap(v =>
  v.items.map((text, idx) => ({
    id: `${v.id}-${idx}`,
    kind: 'valor',
    valueId: v.id,
    text,
    recurring: true
  }))
)

const ROTINA_BASE = {
  manha: ['Alongamento', 'Agradecer pelo dia', 'Trabalhar'],
  tarde: ['Comer comida', 'Exercício academia', 'Projeto', 'Estudo de curso de TI'],
  noite: [
    'Passear com os cachorros | Passear sozinho',
    'Ler livro',
    'Digitação | mínimo de velocidade 44',
    '10min sem celular antes de dormir'
  ]
}

const WEEKDAYS_UTEIS = [1, 2, 3, 4, 5] 

const rotinaItems = WEEKDAYS_UTEIS.flatMap(weekday => {
  const tarde = [...ROTINA_BASE.tarde]
  if (weekday === 4 || weekday === 5) tarde.push('Tarefa de autocuidado')

  const dayItems = [
    ...ROTINA_BASE.manha.map(text => ({ period: 'manha', text })),
    ...tarde.map(text => ({ period: 'tarde', text })),
    ...ROTINA_BASE.noite.map(text => ({ period: 'noite', text }))
  ]

  return dayItems.map((item, idx) => ({
    id: `rotina-${weekday}-${idx}`,
    kind: 'rotina',
    period: item.period,
    weekday,
    text: item.text,
    recurring: true
  }))
})

export const defaultData = {
  version: 5,
  values,
  checklistItems: [...valorItems, ...rotinaItems],
  dailyCycles: {}
}