FROM python:3.13-alpine
ARG VERSION=unknown

WORKDIR /app

COPY ./requirements.txt .
RUN pip3 install -r ./requirements.txt

COPY . .

ENV VERSION=$VERSION

ENTRYPOINT ["python3", "-m"]
CMD ["matcher"]
