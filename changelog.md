# 1.5.5 (08 mai 2020)
## Mudanças
* Zoom não precisa de credenciais para mudar informar mudança de status da ordem.

## Buxfix
* Atualização do status do pedido da Zoom na lista de pedidos.
* Nota fiscal não mostrava corretamente os campos inválidos na criação da mesma.

## Melhorias
* Iclusão automática do CNPJ e dá série na nota fiscal.



# 1.5.2 (05 mai 2020)
## Melhorias
* Mensagem de produto inválido para requisiçoes de informações dos produtos.

# 1.5.1 (11 abr 2020)
## Bug fix
* Correios não era exibido na hora do fechamento da compra.
* Peso usado para estimar o frete do correio não estava considerando as gramas.

## Melhorias
* Negrito para opções de entrega, na página de seleção do método de envio.
* Texto do item "Forma de pagamento" na página de resumo da ordem.
* Texto do item "Forma de pagamento" na página de pedidos do usuário.

## Erro ortográfico
* Página resumo da ordem, correção da palavra "itens".


# 1.5.0 (07 abr 2020)
## Melhorias
* Usando valor do produto para estimar valor do frete.


# 1.4.5 (27 mar 2020)
## Melhorias
* Não exibe a opção de pagamento em dinheiro e cartão presencial para pedidos que contêm produtos da Aldo.
* Exibe opções de pagamento na página de seleção da forma de envio.


# 1.4.4 (24 mar 2020)
## Bug fix
* Exibindo as formas de pagamento corretamente.
* Formatado a descrição da forma de envio na página de ordens.


# 1.4.3 (12 fev 2020)
## Melhorias
* Usando "vue": "2.6.11"
* Usando "axios": "0.19.2"


# 1.4.2 (12 fev 2020)
## Melhorias
* API para obter informações do produto.


# 1.4.1 (11 fev 2020)
## Melhorias
* Script para compilação dos arquivos bundles.
* Arquivos js fora do controle de versão, usando apenas bundle files.
* Usando zunkasite folder for logs.


# 1.4.0 (10 fev 2020)
## Melhorias
* Usando motoboy fretes do servidor de endereços.
## Bug fix
* Quando produto Aldo é criado novamente, não atualiza o antigo apagado em vez de cria-lo novamente. 


# 1.3.2 (10 fev 2020)
## Melhorias
* Inclusão do fabricante HP e PNY.
* Inclusão da categoria impressoras.


# 1.3.1 (18 jan 2020)
## Melhorias
* Inclusão do fabricante Corsair.


# 1.3.0 (06 jan 2020)
## Melhorias
* Produto não é removido do banco de dados quando o mesmo é apagado do cadastramento.
* Adição do campo deletedAt no documento "product", para que produtos apagados possam ser identificados por outras rotinas. 
* Evita que o pedido seja finalizado mais de uma vez, quando o usuário usa o botão de voltar do browser.



# 1.2.6 (19 dez 2019)

## Bug fix
* Separado decimal para entrega padrão corrigido para "." (paypal estava retornando erro para entrega padrão).
* Esconde a mensagem "Pesquisando o frete ..." quando existe algum campo inválido ao clicar no botão "Enviar para este endereço".



# 1.2.5 (12 dez 2019)

## Melhorias
* Markdown ul format.



# 1.2.4 (11 dez 2019)

## Melhorias
* Menu categorias ordenado por ordem alfabética.
* Opção de escolher o tipo de garantia através de um listbox.
* Criação do campo **prioridade de exibição** na página de edição de produtos.
* Exibe todos os produtos ordenando inicialmente por prioridade de exibição, quando nenhuma opção de ordenação é selecionada.

## Configurações
* Inclusão da categoria Drones.
* Inclusão do fabricante Dji.
* markdown ul (unordered list) formatted.

## Debug
* Remoção de log quando apaga mongodb_id aldo produto.





# 1.2.3 (10 dez 2019)

## Bug Fix
* Usando https em vez de http para apagar mongodb_id do produto da aldo.

## Debug
* Remoção de log para depuração de download de imagens.




# 1.2.1 (10 dez 2019)

## Recursos novos
* Changelog page.
* Exibição da versão atual.

## Debug
* Criação de log para depuração de download de imagens.




# 1.2.0 (10 dez 2019)

## Importação dos produtos da Aldo
* Aceita até 30000 caracteres na importação da descrição do produto.
* Imagens são importadas.

## Página de edição de produtos
* Botão **Salvar e voltar** e **Salvar e ver produto** estão de volta.

## Inclusão de fabricantes
* Zotac
* Galax
* ADATA

## Markdown
* Formatação da lista ordenada.

## Bug Fix
* Logging request para as rotas ext e setup


# 1.1.0 (6 dez 2019)

## Página **Endereço para envio** 
* Ao clicar em **Adicionar um novo endereço para envio** a página é corretamente rolada até a opção de criar novo endereço.  
* Ao clicar em **Enviar para este endereço** é exibido a mensagem **Pesquisando frete . . .**, devido a demora de resposta do webservice dos correios.
* **CEP inválido** em vermelho é exibido no lugar do nome do campo **CEP**, de modo a evitar mudar a disposição dos campos a baixo dele.

## Página **Produto**
* Ao clicar em **Adicionar ao carrinho**, se o produto for da aldo, confere a disponibilidade de pelo menos dois produtos no webservice da aldo e exibe a mensagem **Confirmando a disponibilidade do produto**, devido a demora de resposta do webservice da aldo.

## Página **Forma de envio**
* Ao clicar em "Continuar", verifica se a Aldo tem diponível a quantidade de produtos requeridas + 1.   

## Criação do produto no site
* Descrição técnica sendo importada como markdown no campo Info (markdown).
* Vaio adicionado a lista de fabricantes.
* Usando preço sugerido pelo fornecedor como preço de venda e calculando o valor do lucro.
* Mantendo títlulo original em caixa alta.

## Pagamento
* Possível selecionar pagamento em cartão presencial para entrega por motoboy.
* Não existe mais a possibilidade de pagamento por cartão de crédito online ou paypal para entregas por motoboy.
* As telas de pedidos, confirmação de pedio e resumo do pedido foram alteradas para exibir pagamento em cartão presencial.

## Produtos
* Na página inicial (novidades e mais vendidos), não são apresentados produtos fora de estoque.
* Na página que lista todos os produtos, são apresentados também os produtos fora de estoque, mas estes aparecem apenas após todos os produtos em estoque.
* Na página que lista todos os produtos, quando é escolhido alguma ordenação os produtos fora de estoque não são apresentados.
* Quando uma pesquisa é realizada são apresentados também os produtos fora de estoque, mas estes aparecem apenas após todos os produtos em estoque.
* Uso do filtro não muda a lógica com relação a exibição ou não dos produtos fora de estoque.
