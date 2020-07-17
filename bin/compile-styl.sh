#!/usr/bin/env bash
# Change to fire directory.
cd $(dirname "$0")
# Compile stylus to css.
# Layout.
mkdir -p ../dist/css/layout
stylus ../styl/layout/ --out ../dist/css/layout/
# Product.
mkdir -p ../dist/css/product
stylus ../styl/product --out ../dist/css/product/
# Admin.
mkdir -p ../dist/css/admin
stylus ../styl/admin --out ../dist/css/admin/
# Checkout.
mkdir -p ../dist/css/checkout
stylus ../styl/checkout --out ../dist/css/checkout/
# User.
mkdir -p ../dist/css/user
stylus ../styl/user --out ../dist/css/user/
# Info.
mkdir -p ../dist/css/info
stylus ../styl/info --out ../dist/css/info/
# Markdown.
mkdir -p ../dist/css/misc
stylus ../styl/misc --out ../dist/css/misc/
