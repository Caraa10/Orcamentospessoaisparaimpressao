# Gerador de orçamentos cirúrgicos

App local em HTML/CSS/JS para montar orçamentos de cirurgia plástica e salvar em PDF pelo navegador.

## Como usar

1. Abra [`app/index.html`](/Users/thiagoferri/Documents/New project/app/index.html) no navegador.
2. Escolha o procedimento, a variação e a complexidade.
3. Revise os honorários, preencha hospital e itens extras quando necessário.
4. Complete os textos do orçamento.
5. Clique em `Imprimir / salvar em PDF`.

## Observações

- Os procedimentos foram carregados a partir da tabela CSV enviada.
- O CSV atual alimenta honorários cirúrgicos e anestesia.
- O campo `Hospital` ficou manual, porque esse valor não aparece de forma separada no arquivo recebido.
- O app salva o preenchimento recente no navegador usando `localStorage`.
