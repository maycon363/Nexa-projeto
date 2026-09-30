const CATEGORIES = [
  {
    title: 'Montar uma rotina inteira',
    hint: 'Em vez de clicar item por item, descreve o dia e deixa a IA montar.',
    examples: [
      'Cria minha rotina de segunda: manhã com alongamento e café, tarde com academia e projeto, noite com leitura e 10min sem celular',
      'Adiciona "arrumar a cama" e "beber água" na manhã de hoje'
    ]
  },
  {
    title: 'Criar um valor novo, já populado',
    hint: 'Cria o valor e os itens de checklist na mesma mensagem.',
    examples: [
      'Cria o valor Calma com itens tipo respirar fundo antes de reagir, não levar trabalho pra cama, e ouvir música relaxante',
      'Cria o valor Foco com 4 itens de checklist coerentes'
    ]
  },
  {
    title: 'Marcar/desmarcar em lote',
    hint: 'Economiza clicar em cada caixinha uma por uma.',
    examples: [
      'Marca tudo de Disciplina hoje',
      'Desmarca todos os itens de rotina da manhã'
    ]
  },
  {
    title: 'Editar e limpar',
    hint: 'Corrige texto ou remove sem precisar procurar o item na lista.',
    examples: [
      'Edita o item "Ler livro" pra "Ler livro de autoconhecimento"',
      'Remove o item "Digitação" da rotina de hoje'
    ]
  },
  {
    title: 'Pedir uma avaliação de verdade',
    hint: 'Não é resposta genérica, ela olha seus dados reais (rotina, valores, consistência) antes de responder.',
    examples: [
      'Como estou indo essa semana?',
      'Qual hábito eu ando mais negligenciando no Mapeamento?',
      'Me dá um feedback sincero sobre meus valores'
    ]
  }
]

function fireExample(text) {
  window.dispatchEvent(new CustomEvent('nexa:prefillChat', { detail: text }))
}

export default function LearnView() {
  return (
    <div>
      <section className="value-section">
        <h2 className="about-subtitle" style={{ marginTop: 0 }}>A IA está aqui pra economizar seu tempo</h2>
        <p className="about-p">
          Ela não é só pra bater papo, é pra fazer o trabalho manual de montar listas
          e analisar seus dados por você.
        </p>

        <ol className="learn-steps">
          <li>Clica em qualquer exemplo abaixo (ou escreve o seu próprio pedido)</li>
          <li>O chat abre com o texto já pronto no campo, nada é enviado sozinho</li>
          <li>Revisa, ajusta se quiser, e manda</li>
        </ol>
      </section>

      {CATEGORIES.map(cat => (
        <section className="value-section" key={cat.title}>
          <h3 className="learn-cat-title">{cat.title}</h3>
          <p className="learn-cat-hint">{cat.hint}</p>
          <div className="learn-examples">
            {cat.examples.map(ex => (
              <button key={ex} className="learn-example" onClick={() => fireExample(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="value-section">
        <h3 className="learn-cat-title">Funcionalidades que não passam pelo chat</h3>
        <p className="learn-cat-hint">
          Essas você usa direto na tela, sem precisar pedir pra IA.
        </p>

        <p className="about-p">
          <strong>Configurações (ícone de engrenagem na navbar):</strong> a rotina é
          sempre o padrão fixo da tela Hoje, mas dá pra escolher se a seção "Valores"
          e o cartão de "Mapeamento de hábitos" aparecem junto ou não. Escolha fica
          salva pra você, não precisa mexer de novo toda vez.
        </p>

        <p className="about-p">
          <strong>Mapeamento de hábitos (na tela Hoje):</strong> liste qualquer hábito
          seu, automático, sem filtro, do jeito que está de verdade — bom ou ruim (ex:
          "lavar as mãos depois do banheiro" ou "mexer no celular assim que acordo").
          Depois classifica como Bom, Ruim ou Neutro, na mão ou tocando em
          "Perguntar à IA" pra ela sugerir. É o mesmo exercício do "cartão de hábitos"
          do livro Hábitos Atômicos: o primeiro passo pra mudar um hábito é enxergar
          ele com clareza.
        </p>

        <p className="about-p">
          <strong>Apagar um valor inteiro (ícone de lixeira em cada Valor):</strong>
          apaga só aquele valor específico e os itens dele, os outros valores
          continuam intactos. Pede confirmação antes, porque não tem como desfazer.
        </p>

        <p className="about-p" style={{ marginBottom: 0 }}>
          <strong>Exportar/Importar JSON (no rodapé do app):</strong> Exportar baixa um
          arquivo com tudo que você tem hoje (rotina, valores, hábitos, histórico dos
          dias). Importar lê um desses arquivos e substitui os seus dados atuais pelos
          do arquivo — útil pra fazer backup ou levar seus dados pra outro
          navegador/celular. Detalhes de como funciona estão na aba Sobre.
        </p>
      </section>

      <section className="value-section">
        <h3 className="learn-cat-title">O que ela ainda não faz</h3>
        <p className="about-p" style={{ marginBottom: 0 }}>
          Por enquanto, criar subtarefas (aqueles sub-itens com "+") ainda precisa ser feito
          direto na tela "Hoje", a IA ainda não cria isso pelo chat.
        </p>
      </section>
    </div>
  )
}