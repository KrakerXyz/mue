FROM node:16-slim
COPY package*.json /
COPY dist/ /dist/
COPY node_modules/ /node_modules/
COPY bin/ /bin/
EXPOSE 3001
CMD ["node", "."]