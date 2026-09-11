import test from 'node:test';
import assert from 'node:assert/strict';
import {parseInventoryCSV} from '../lib/inventory.ts';
test('Excel CSV with BOM, CRLF and semicolon keeps zero price and negative adjustment',()=>{assert.deepEqual(parseInventoryCSV('\uFEFFsku;stock;price\r\nCZ-01;-2;0\r\nCT-01;3;'),[{sku:'CZ-01',stock:-2,price:0},{sku:'CT-01',stock:3}])});
test('reject duplicate SKUs, invalid amounts and formulas',()=>{for(const csv of ['sku,stock\na,1\na,2','sku,stock\na,1.2','sku,stock\na,','sku,stock\n=SUM(A1),2','sku,stock,price\na,1,-20','sku,stock\na,Infinity'])assert.throws(()=>parseInventoryCSV(csv))});
test('reject oversized import',()=>assert.throws(()=>parseInventoryCSV('sku,stock\n'+Array.from({length:501},(_,i)=>`SKU-${i},1`).join('\n'))));
