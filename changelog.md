## 1.8.0 (07 Janeiro 2022)
### Change
Opção de pagar pelo Paypal para entrega por motoboy

## 1.7.0 (06 Janeiro 2022)
### Change
Opção de cartão presencial removido

## 1.16.7 (16 Setembro 2021)
### Bug fix
Atualizava a quantidade de produtos ao cancelar a ordem, mesmo quando não solicitado.

## 1.16.6 (05 Agosto 2021)
### Bug fix
Não permite tipo string para value_type number_* ao criar produto no Mercado Livre.

## 1.16.5 (30 Julho 2021)
### Novo
Adicionado gtin (ean) atributo para a criação do produto no Mercado Livre.  
Adiciona descrição do produto adicionado no Mercado Livre.  
Adicionado o fabricante MYMAX.  

## 1.16.3 (17 Julho 2021)
### Bugfix
Corrigido nome da propriedade para criação do produto meli para gold pro: listing_type_id.

## 1.16.2 (12 Julho 2021)
### Bugfix
Corrigido nome da propriedade para criação do produto meli: listing_type_id.
Correção do campo description para descriptions na criação do produto no Mercadolivre.
Informações do Mercadolivre quando o produto era criado, não estava sendo exibidas.

### Novo
Inclusão do EAN na criação do produto no Mercadolivre.



## 1.16.1 (7 Julho 2021)
### Novo
Incluído meli commissão e descrição.

## 1.16.0 (18 Junho 2021)
### Novo
Adicionada fabricante Wacom.

## 1.15.11 (14 Junho 2021)
### Novo
Adicionada a categoria de produtos, mesas digitalizadoras.

## 1.15.10 (26 Maio 2021)
### Novo
Liberação de todos os produtos para adição no Mercado Livre.

### Bug
Usando o mesmo id da categoria do Mercado Livre para todas as categorias do Mercado Livre.

## 1.15.8 (25 Maio 2021)
### Novo
Visualização de categorias disponíveis no Mercado Livre.

## 1.15.7 (19 Maio 2021)
### Test
Criação do produto no Mercado Livre.

## 1.15.6 (18 Maio 2021)
### Bugfix
Erro ao obter meli categorias para produto sem categoria zunka.

## 1.15.5 (14 Maio 2021)
### Melhorias
Novos produtos são ordenados por data de edição do administrador apenas, e não por alterações do próprio sistema.

## 1.15.3 (05 Abril 2021)
### Melhorias
Inclusão do fabricante Intelbras  
Formatação da tela do carrinho vazio

## 1.15.2 (05 Mar 2021)
### Melhorias
Inclusão do fabricante Afox e Brother

## 1.15.1 (01 Mar 2021)
### Melhorias
Inclusão do fabricante Smart
Alteração do filtro de preço do produto para exibição no site, de $100,00 para R$1,00

## 1.15.0 (20 Jan 2021)
### Melhorias
Alteração do banco Santander para INTER

## 1.14.2 (04 Jan 2021)
### Melhorias
Inclusão do nome do fornecedor e código do produto no fornecedor na página de detalhes do pedido.
Os ítens na página de lista de pedidos são links que podem ser abertos em outra aba.

## 1.14.1 (07 Dez 2020)
### Melhorias
Log natalino.  
Ao carregar dados de um produto a partir de código zunka ou ean, carrega informações de garantia também.  
Desabilita produto Allnations quando recebe resposta vazia.  

## 1.13.0 (27 Nov 2020)
### Melhorias
Carrega produtos com o mesmo EAN no cadastramento do produto.
Usando novo servidor de email.

## 1.12.1 (26 Nov 2020)
### Melhorias
Exibe se o produto está ativo no fornecedor e se foi selecionado para comercializar no cadastramento do produto.

## 1.12.0 (22 Nov 2020)
### Melhorias
Ao inserir um código que já existe o sistema dá a opção de carregar as informações ou sobre escrever.

## 1.11.1 (17 Nov 2020)
### Melhorias
Produtos com o mesmo código zunka são tratados como produtos iguais.
* Apenas o mais barato é exibido no site.
* Quando um produto é salvo todos os outros produtos com o mesmo código zunka são atualizados.
Opção de habilitar ou desabilitar produtos por fornecedor.
Adicionado fabricante PowerColor.

## 1.10.8 (22 out 2020)
### Melhorias
* Adicionado fabricante APC e SMS.

### Bugfix
* Produto Allantions era atualizado com estoque negativo.

## 1.10.7 (14 out 2020)
### Melhorias
* Lista de produtos (admin) com filtros.


## 1.10.6 (14 out 2020)
### Melhorias
* Teste de email é enviado para admin e dev.


## 1.10.5 (12 out 2020)
### Melhorias
* Adicionado fabricante Samsung.
* Test com novo email.


## 1.10.4 (08 out 2020)
### Melhorias
* Adicionado fabricante Cooler Master e Epson.
* Atualiza produto estoque com menos valor mínimo para venda, quando atualizado pela API.

### Bugfix
* Select para exibir produtos allnations estava com restrição de quantidade de estoque errada.
* Wrong reference module allnations.


## 1.10.2 (05 out 2020)
### Melhorias
* Tabela com frete por fornecedor.
* Utilizando nova API de fretes.
* Aceita qualquer tamanho de GTIN/EAN na importação de produtos.
* Aceita qualquer tamanho para descrição do produto na importação de produtos.

### Bugfix
* Informa corretamente sem tem estoque de produto Allnations.


## 1.9.1 (21 set 2020)
### Melhorias
* Informações adicionais do produto é processado como markdown.
* Título já incluso no html, não é necessário incluir no markdown.
* API setup não verifica ean, pois aldo não tem ean.


## 1.8.1 (15 set 2020)
### Melhorias
* Inclusão de inscrição estatudal, cnpj e contato no email de compra concluída que é enviado para o admin.
* Inclusão da razão social na confirmação do pedido.


## 1.8.0 (08 set 2020)
### Melhorias
* Criação e remoção de produtos allnations.
* Inclusão de link para produtos allnations.


## 1.7.2 (27 ago 2020)
### Melhorias
* Inclusão do fabricante Gigabyte.
* Mudança nos textos da forma de envio.
* Formatação do markdown.


## 1.7.1 (22 jul 2020)
### Melhorias
* Formatação das páginas para uso em celular.

### Bugfix
* Zoom da imagem do produto.


## 1.6.5 (13 jul 2020)
### Melhorias
* Botão para copiar imagem link na página de imagens.
* Outline removido quando botão está selecionado.


## 1.6.4 (08 jul 2020)
### Melhorias
* Página para upload de imagens gerais.


## 1.6.3 (07 jul 2020)
### Melhorias
* API para alterar quantidade de produtos em estoque.
* API para obter produto aldo, informa quantidade de estoque.
* Não mostra produtos aldo sem estoque.
* Exibe produtos sem estoque como "Sob Encomenda".
* Cria zoom ordem, mesmo sem estoque.


## 1.6.0 (04 jul 2020)
### Melhorias
* Usando imagem dos produtos com resolção 500px em vez de 300px.
* Título maior nas telas de lista de produtos.


## 1.5.20 (03 jul 2020)
### Melhorias
* Usando imagem com resolção 300px em vez de 200px na página de produtos.
* Usando shadow apenas com mouse over.
* Removendo padding na página de produtos quando formato é apenas uma coluna.


## 1.5.19 (26 jun 2020)
### Bugfix
* Zoom do produto na página de produto.


## 1.5.18 (25 jun 2020)
### Melhorias
* Na página de seleção/criação de endereço, mensagens de erros mais pŕoximo dos campos.
* Na página de seleção/criação de endereço, foi corrigida as mensagens exibidas durante a pesquisa de CEP.
* Na página de conta deletada, texto da mensagem na cor preta.
* Na página de inserção de CPF/CNPJ foi alterada a mensagem quando o campo é inválido.
* Na página de seleção da forma de pagamento, a opção de pagamento por cartão de débito foi removida.
* Na página de confirmação do pedido, a cor do título foi alterado para verde.

### Bugfix
* Mostrando produtos apagados no site.
* Removendo produto do estoque quando a Zoom cancela uma ordem.


## 1.5.17 (22 jun 2020)
### Melhorias.
* Inclusão da opção de cadastro por CNPJ com número de inscrição e nome para contato.
* Páginas para edição do número do CNPJ, inscrição e nome para contato.
* Exibição do CNPJ, inscirção e nome para contato nas páginas de pedidos e detalhes os usuário.


## 1.5.16 (12 jun 2020)
### Melhorias.
* Verifica se pagamento concluído para vendas pelo paypal.
* Botão para verificar se ordem foi paga, para pagamento pelo paypal também.


## 1.5.15 (07 jun 2020)
### Novos recursos.
* End point para to disable product.


## 1.5.14 (06 jun 2020)
### Novos recursos.
* Também muda o pedido zoom para entregue no evento de recebimento do pedido da zoom.
### Bug fix.
* Erro no log de pedido alterado para entregue.


## 1.5.12 (04 jun 2020)
### Bug fix.
* End point get all products aldo, not return deleted products.


## 1.5.11 (03 jun 2020)
### Novos recursos.
* No cadastro da nota fiscal aceita número e chave de acesso com até 60 caracteres.


## 1.5.10 (01 jun 2020)
### Novos recursos.
* End point para atualização do dealerPrice e dealerProductAvailability do produto.
* End point para obter dealerPrice e dealerProductAvailability do produto.


## 1.5.9 (20 mai 2020)
### Mudanças
* Linka para produto aldo na página de edição de produto.


## 1.5.8 (13 mai 2020)
### Mudanças
* Cria a ordem zoom no evento de nova ordem, não mais no evento de pagamento aprovado.


## 1.5.7 (11 mai 2020)
### Mudanças
* Zoom não precisa de credenciais para mudar informar mudança de status da ordem.

### Buxfix
* Atualização do status do pedido da Zoom na lista de pedidos.
* Nota fiscal não mostrava corretamente os campos inválidos na criação da mesma.

### Melhorias
* Iclusão automática do CNPJ e dá série na nota fiscal.



## 1.5.2 (05 mai 2020)
### Melhorias
* Mensagem de produto inválido para requisiçoes de informações dos produtos.

## 1.5.1 (11 abr 2020)
### Bug fix
* Correios não era exibido na hora do fechamento da compra.
* Peso usado para estimar o frete do correio não estava considerando as gramas.

### Melhorias
* Negrito para opções de entrega, na página de seleção do método de envio.
* Texto do item "Forma de pagamento" na página de resumo da ordem.
* Texto do item "Forma de pagamento" na página de pedidos do usuário.

### Erro ortográfico
* Página resumo da ordem, correção da palavra "itens".


## 1.5.0 (07 abr 2020)
### Melhorias
* Usando valor do produto para estimar valor do frete.


## 1.4.5 (27 mar 2020)
### Melhorias
* Não exibe a opção de pagamento em dinheiro e cartão presencial para pedidos que contêm produtos da Aldo.
* Exibe opções de pagamento na página de seleção da forma de envio.


## 1.4.4 (24 mar 2020)
### Bug fix
* Exibindo as formas de pagamento corretamente.
* Formatado a descrição da forma de envio na página de ordens.


## 1.4.3 (12 fev 2020)
### Melhorias
* Usando "vue": "2.6.11"
* Usando "axios": "0.19.2"


## 1.4.2 (12 fev 2020)
### Melhorias
* API para obter informações do produto.


## 1.4.1 (11 fev 2020)
### Melhorias
* Script para compilação dos arquivos bundles.
* Arquivos js fora do controle de versão, usando apenas bundle files.
* Usando zunkasite folder for logs.


## 1.4.0 (10 fev 2020)
### Melhorias
* Usando motoboy fretes do servidor de endereços.
### Bug fix
* Quando produto Aldo é criado novamente, não atualiza o antigo apagado em vez de cria-lo novamente. 


## 1.3.2 (10 fev 2020)
### Melhorias
* Inclusão do fabricante HP e PNY.
* Inclusão da categoria impressoras.


## 1.3.1 (18 jan 2020)
### Melhorias
* Inclusão do fabricante Corsair.


## 1.3.0 (06 jan 2020)
### Melhorias
* Produto não é removido do banco de dados quando o mesmo é apagado do cadastramento.
* Adição do campo deletedAt no documento "product", para que produtos apagados possam ser identificados por outras rotinas. 
* Evita que o pedido seja finalizado mais de uma vez, quando o usuário usa o botão de voltar do browser.



## 1.2.6 (19 dez 2019)

### Bug fix
* Separado decimal para entrega padrão corrigido para "." (paypal estava retornando erro para entrega padrão).
* Esconde a mensagem "Pesquisando o frete ..." quando existe algum campo inválido ao clicar no botão "Enviar para este endereço".



## 1.2.5 (12 dez 2019)

### Melhorias
* Markdown ul format.



## 1.2.4 (11 dez 2019)

### Melhorias
* Menu categorias ordenado por ordem alfabética.
* Opção de escolher o tipo de garantia através de um listbox.
* Criação do campo **prioridade de exibição** na página de edição de produtos.
* Exibe todos os produtos ordenando inicialmente por prioridade de exibição, quando nenhuma opção de ordenação é selecionada.

### Configurações
* Inclusão da categoria Drones.
* Inclusão do fabricante Dji.
* markdown ul (unordered list) formatted.

### Debug
* Remoção de log quando apaga mongodb_id aldo produto.





## 1.2.3 (10 dez 2019)

### Bug Fix
* Usando https em vez de http para apagar mongodb_id do produto da aldo.

### Debug
* Remoção de log para depuração de download de imagens.




# 1.2.1 (10 dez 2019)

### Recursos novos
* Changelog page.
* Exibição da versão atual.

### Debug
* Criação de log para depuração de download de imagens.




## 1.2.0 (10 dez 2019)

### Importação dos produtos da Aldo
* Aceita até 30000 caracteres na importação da descrição do produto.
* Imagens são importadas.

### Página de edição de produtos
* Botão **Salvar e voltar** e **Salvar e ver produto** estão de volta.

### Inclusão de fabricantes
* Zotac
* Galax
* ADATA

### Markdown
* Formatação da lista ordenada.

### Bug Fix
* Logging request para as rotas ext e setup


## 1.1.0 (6 dez 2019)

### Página **Endereço para envio** 
* Ao clicar em **Adicionar um novo endereço para envio** a página é corretamente rolada até a opção de criar novo endereço.  
* Ao clicar em **Enviar para este endereço** é exibido a mensagem **Pesquisando frete . . .**, devido a demora de resposta do webservice dos correios.
* **CEP inválido** em vermelho é exibido no lugar do nome do campo **CEP**, de modo a evitar mudar a disposição dos campos a baixo dele.

### Página **Produto**
* Ao clicar em **Adicionar ao carrinho**, se o produto for da aldo, confere a disponibilidade de pelo menos dois produtos no webservice da aldo e exibe a mensagem **Confirmando a disponibilidade do produto**, devido a demora de resposta do webservice da aldo.

### Página **Forma de envio**
* Ao clicar em "Continuar", verifica se a Aldo tem diponível a quantidade de produtos requeridas + 1.   

### Criação do produto no site
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
