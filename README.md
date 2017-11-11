## fetchi

### Usage

```txt
  Usage: fetchi [options] url


  Options:

    -V, --version                          output the version number
    -X, --method <method>                  method of this HTTP request
    -d, --data <data>                      request body payload
    -c, --content-type <mime type name>    set Content-Type header
    -H, --headers [header1, header2, ...]  set other headers
    -h, --help                             output usage information
```

## Examples

```bash
$ fetchi http://httpbin.org/anything
200 OK
Connection: close
Server: meinheld/0.6.1
Date: Sat, 11 Nov 2017 16:04:45 GMT
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Powered-By: Flask
X-Processed-Time: 0.000786066055298
Content-Length: 413
Via: 1.1 vegur

{
  "args": {},
  "data": "",
  "files": {},
  "form": {},
  "headers": {
    "Accept": "*/*",
    "Accept-Encoding": "gzip,deflate",
    "Connection": "close",
    "Content-Type": "null",
    "Host": "httpbin.org",
    "User-Agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"
  },
  "json": null,
  "method": "GET",
  "origin": "123.123.123.123",
  "url": "http://httpbin.org/anything"
}
```

```bash
$ fetchi http://httpbin.org/user-agent -H "user-agent: lorem"
200 OK
Connection: close
Server: meinheld/0.6.1
Date: Sat, 11 Nov 2017 16:06:18 GMT
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
X-Powered-By: Flask
X-Processed-Time: 0.000539064407349
Content-Length: 28
Via: 1.1 vegur

{
  "user-agent": "lorem"
}
```

```bash
$ fetchi http://httpbin.org/post -X post -d '{"name": "fetchi", "decription": "yet another curl like HTTP request CLI tool"}'
```
