#!/usr/bin/env bash

read -r URL TYPE TOKEN <<< $(./token.sh $1)

for ID in `./list-profiles.sh | jq '.[] | .id' | sed 's/"//g'`
do
	RES=$(curl -s -X DELETE ${URL}payment-experience/web-profiles/${ID} \
	-H "Content-Type: application/json" \
	-H "Authorization: $TYPE $TOKEN")

	# echo $RES
done
