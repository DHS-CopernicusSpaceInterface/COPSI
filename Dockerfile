##FROM httpd:2.4.57-bullseye
FROM httpd:2.4.65-trixie


RUN apt-get update && apt-get -y upgrade && apt-get -y autoremove && set -eux && apt-get install -y --no-install-recommends ca-certificates libaprutil1-ldap libldap-common && rm -rf /var/lib/apt/lists/* && apt-get -y remove libcurl4 && echo "RewriteEngine on" >> /usr/local/apache2/htdocs/.htaccess && echo "RewriteCond %{REQUEST_FILENAME} -f [OR]" >> /usr/local/apache2/htdocs/.htaccess && echo "RewriteCond %{REQUEST_FILENAME} -d " >> /usr/local/apache2/htdocs/.htaccess && echo "RewriteRule ^ - [L]" >> /usr/local/apache2/htdocs/.htaccess && echo "RewriteRule ^ index.html [L]" >> /usr/local/apache2/htdocs/.htaccess

COPY ./apache-conf/httpd.conf /usr/local/apache2/conf/httpd.conf

COPY ./dist/copsi/browser/ /usr/local/apache2/htdocs/
