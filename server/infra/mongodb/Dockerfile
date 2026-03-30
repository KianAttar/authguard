FROM mongo:latest

LABEL author="Hassan Attar <h.a.develops@gmail.com>"

COPY mongod.conf /etc/mongo/mongod.conf

EXPOSE 27017

CMD ["mongod", "--config", "/etc/mongo/mongod.conf"]
