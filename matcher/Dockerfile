FROM python:3.13-alpine

WORKDIR /app

COPY ./requirements.txt .
RUN pip3 install -r ./requirements.txt

COPY . .

CMD ["python3", "-m", "matcher"]
