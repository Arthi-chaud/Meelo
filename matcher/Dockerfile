FROM python:3.14-alpine
ARG VERSION=unknown

WORKDIR /app

COPY ./requirements.txt .
RUN pip3 install -r ./requirements.txt

COPY . .

ENV VERSION=$VERSION

CMD ["fastapi", "run", "matcher", "--port", "6789"]
