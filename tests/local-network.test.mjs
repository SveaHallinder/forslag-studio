import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Readable} from 'node:stream';
import {gzipSync} from 'node:zlib';
import {publicAddress,createPublicFetcher} from '../scripts/local-network.mjs';
import {readPublic} from '../worker.mjs';

const resolve=async()=>[{address:'93.184.215.14',family:4}];
function transport({body='OK',headers={'content-type':'text/html'},status=200,inspect=()=>{}}={}) {
  return (url,options,callback)=>{
    inspect(url,options);const request=new EventEmitter();request.destroy=()=>{};
    request.end=()=>queueMicrotask(()=>{const response=Readable.from([Buffer.from(body)]);response.statusCode=status;response.headers=headers;callback(response);});return request;
  };
}
test('local networking rejects private, metadata, documentation and transition IP ranges',()=>{
  for(const address of ['0.0.0.0','10.1.2.3','100.64.0.1','127.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','192.0.0.1','192.0.2.1','192.88.99.1','198.18.0.1','198.51.100.1','203.0.113.1','224.1.1.1','255.255.255.255','::1','fe80::1','fc00::1','::ffff:127.0.0.1','2001:db8::1','2002:7f00:1::','3fff::1','not-an-ip'])assert.equal(publicAddress(address),false,address);
  for(const address of ['1.1.1.1','8.8.8.8','93.184.215.14','172.32.0.1','2001:4860:4860::8888','2606:4700:4700::1111'])assert.equal(publicAddress(address),true,address);
});
test('private or mixed DNS answers are rejected before opening a socket',async()=>{
  for(const addresses of [[{address:'127.0.0.1',family:4}],await resolve().then(list=>[...list,{address:'::1',family:6}])]){
    const fetcher=createPublicFetcher({resolve:async()=>addresses,request:()=>assert.fail('must not connect')});
    await assert.rejects(fetcher('https://example.com'),/privata/);
  }
});
test('a validated DNS answer is pinned to the actual socket without a second lookup',async()=>{
  let calls=0;const fetcher=createPublicFetcher({resolve:async()=>{calls++;return calls===1?await resolve():[{address:'127.0.0.1',family:4}];},request:transport({inspect:(url,options)=>{
    assert.equal(url.hostname,'example.com');assert.equal(options.agent,false);
    options.lookup('example.com',{all:true},(error,addresses)=>{assert.equal(error,null);assert.deepEqual(addresses,[{address:'93.184.215.14',family:4}]);});
    options.lookup('example.com',{},(error,address,family)=>{assert.equal(address,'93.184.215.14');assert.equal(family,4);});
  }})});
  assert.equal(await(await fetcher('https://example.com')).text(),'OK');assert.equal(calls,1);
});
test('raw HTML, CSS, image and font fetching cannot follow a redirect to private DNS',async()=>{
  const fetcher=createPublicFetcher({resolve:async host=>host==='example.com'?await resolve():[{address:'127.0.0.1',family:4}],request:transport({status:302,headers:{location:'https://private.example/'}})});
  for(const type of [false,'style',true,'font'])await assert.rejects(readPublic('https://example.com',type,fetcher),/privata/);
});
test('compressed bodies have a decompressed size limit and correct response headers',async()=>{
  const compressed=gzipSync('x'.repeat(200));
  const fetcher=createPublicFetcher({resolve,request:transport({body:compressed,headers:{'content-type':'text/html','content-encoding':'gzip','content-length':String(compressed.length)}})});
  await assert.rejects(fetcher('https://example.com',{maximumBytes:100}),error=>error.status===413);
  const response=await fetcher('https://example.com',{maximumBytes:500});assert.equal((await response.text()).length,200);assert.equal(response.headers.get('content-encoding'),null);assert.equal(response.headers.get('content-length'),null);
});
test('aborted DNS, unsafe URLs and oversized POSTs never create an outbound request',async()=>{
  const fetcher=createPublicFetcher({resolve:()=>new Promise(()=>{}),request:()=>assert.fail('must not connect')});
  const controller=new AbortController();controller.abort();await assert.rejects(fetcher('https://example.com',{signal:controller.signal}));
  for(const url of ['http://localhost/','https://127.0.0.1/','file:///etc/passwd','https://example.com:444/','https://user:secret@example.com/'])await assert.rejects(fetcher(url));
  await assert.rejects(fetcher('https://example.com',{method:'POST',body:'x'.repeat(64_001)}),error=>error.status===413);
});
