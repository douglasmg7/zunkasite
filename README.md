# Zunka site  

> v1.1.1 - 9 dez 2019

**Página "Produto - admin"**
* Botão *"Salvar e voltar"* e *"Salvar e ver produto"* estão de volta.

**Fabricantes inclusos:**
* Zotac
* Galax
* ADATA

> v1.1.0 - 6 dez 2019

### Aldo

**Página "Endereço para envio"** 
* Ao clicar em *"Adicionar um novo endereço para envio"* a página é corretamente rolada até a opção de criar novo endereço.  
* Ao clicar em *"Enviar para este endereço"* é exibido a mensagem *"Pesquisando frete . . ."*, devido a demora de resposta do webservice dos correios.
* *"CEP inválido"* em vermelho é exibido no lugar do nome do campo *"CEP"*, de modo a evitar mudar a disposição dos campos a baixo dele.

**Página "Produto"**
* Ao clicar em *"Adicionar ao carrinho"*, se o produto for da aldo, confere a disponibilidade de pelo menos dois produtos no webservice da aldo e exibe a mensagem *"Confirmando a disponibilidade do produto"*, devido a demora de resposta do webservice da aldo.

**Página "Forma de envio"**
* Ao clicar em *"Continuar"*, verifica se a Aldo tem diponível a quantidade de produtos requeridas + 1.   

**Criação do produto no site**
* Descrição técnica sendo importada como markdown no campo Info (markdown).
* Vaio adicionado a lista de fabricantes.
* Usando preço sugerido pelo fornecedor como preço de venda e calculando o valor do lucro.
* Mantendo títlulo original em caixa alta.

### Pagamento

* Possível selecionar pagamento em cartão presencial para entrega por motoboy.
* Não existe mais a possibilidade de pagamento por cartão de crédito online ou paypal para entregas por motoboy.
* As telas de pedidos, confirmação de pedio e resumo do pedido foram alteradas para exibir pagamento em cartão presencial.

### Produtos

* Na página inicial (novidades e mais vendidos), não são apresentados produtos fora de estoque.
* Na página que lista todos os produtos, são apresentados também os produtos fora de estoque, mas estes aparecem apenas após todos os produtos em estoque.
* Na página que lista todos os produtos, quando é escolhido alguma ordenação os produtos fora de estoque não são apresentados.
* Quando uma pesquisa é realizada são apresentados também os produtos fora de estoque, mas estes aparecem apenas após todos os produtos em estoque.
* Uso do filtro não muda a lógica com relação a exibição ou não dos produtos fora de estoque.
