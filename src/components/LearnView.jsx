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
          Ela não é só pra bater papo é pra fazer o trabalho manual de montar listas
          por você. Clica em qualquer exemplo abaixo pra já mandar ele pro assistente.
        </p>
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
    </div>
  )
}