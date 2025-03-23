#!/usr/bin/env node
import { readFileSync } from "fs";
const data = JSON.parse(readFileSync("article_response.json", "utf8"));
console.log("imageUrl:", JSON.stringify(data.imageUrl));
console.log("photo:", JSON.stringify(data.photo));
console.log("mainImage:", JSON.stringify(data.mainImage));

