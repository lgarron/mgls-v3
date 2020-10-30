.PHONY: build
build:
	npx parcel build --public-url . src/index.html
	
.PHONY: dev
dev:
	npx parcel src/index.html

SFTP_PATH = "towns.dreamhost.com:~/experiments.cubing.net/mgls"
URL       = "https://experiments.cubing.net/mgls"

.PHONY: deploy
deploy: clean build
	rsync -avz \
		--exclude .DS_Store \
		--exclude .git \
		./dist/ \
		${SFTP_PATH}
	echo "\nDone deploying. Go to ${URL}\n"

.PHONY: clean
clean: 
	rm -rf ./.cache ./.parcel-cache ./dist 
