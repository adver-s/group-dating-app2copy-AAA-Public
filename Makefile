gen-env-stg:
	aws ssm get-parameters-by-path --path "/myapp/stg/" --with-decryption --query "Parameters[*].[Name,Value]" --output text \
	| awk -F'/' '{print $$NF}' \
	| awk '{print $$1 "=" $$2}' > .env.stg
	@echo "✔ .env.stg generated"
 
gen-env-prod:
	aws ssm get-parameters-by-path --path "/myapp/prod/" --with-decryption --query "Parameters[*].[Name,Value]" --output text \
	| awk -F'/' '{print $$NF}' \
	| awk '{print $$1 "=" $$2}' > .env.prod
	@echo "✔ .env.prod generated" 