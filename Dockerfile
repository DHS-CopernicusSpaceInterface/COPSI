FROM httpd:alpine

RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        apr-util-ldap \
        openldap && \
    apk del curl && \
    echo "RewriteEngine on" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteCond %{REQUEST_FILENAME} -f [OR]" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteCond %{REQUEST_FILENAME} -d" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteRule ^ - [L]" >> /usr/local/apache2/htdocs/.htaccess && \
    echo "RewriteRule ^ index.html [L]" >> /usr/local/apache2/htdocs/.htaccess

COPY ./apache-conf/httpd.conf /usr/local/apache2/conf/httpd.conf

COPY ./dist/copsi/browser/ /usr/local/apache2/htdocs/
