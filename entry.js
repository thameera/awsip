const IpAddr = require('ip-address')

const getIPRanges = async () => {
  console.log('Fetching AWS IP ranges...')
  const data = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json')
  const j = await data.json()

  window.AWS_RANGE_4 = j.prefixes.map(p => {
    const addr = new IpAddr.Address4(p.ip_prefix)
    return {
      addr,
      region: p.region,
      service: p.service
    }
  })
  window.AWS_RANGE_6 = j.ipv6_prefixes.map(p => {
    const addr = new IpAddr.Address6(p.ipv6_prefix)
    return {
      addr,
      region: p.region,
      service: p.service
    }
  })
  console.log('...done IP range fetch')
}

const getRegionNames = async () => {
  console.log('Fetching AWS regions...')
  const data = await fetch('https://raw.githubusercontent.com/jsonmaur/aws-regions/master/regions.json')
  window.AWS_REGIONS = await data.json()
  console.log('...done region fetch')
}

const display = (msg) => {
  document.getElementById('result').innerHTML = msg 
}

const showResults = (prefix) => {
  if (!prefix) {
    return display('Not an AWS IP')
  }
  let out = 'Region: <span>' + AWS_REGIONS.find(r => r.code === prefix.region).full_name + '</span>'
  out += '<br>Region code: <span>' + prefix.region + '</span>'
  out += '<br>Service: <span>' + prefix.service + '</span>'
  out += '<br>Subnet: <span>' + prefix.addr.address + '</span>'
  display(out)
}

const search = async () => {
  const ipstr = document.getElementById('ip').value
  if (!ipstr.trim()) return display('')
  const ip4 = new IpAddr.Address4(ipstr)
  const ip6 = new IpAddr.Address6(ipstr)

  if (ip4.valid) {
    showResults(AWS_RANGE_4.find(p => ip4.isInSubnet(p.addr)))
  } else if (ip6.valid) {
    showResults(AWS_RANGE_6.find(p => ip6.isInSubnet(p.addr)))
  } else {
    display('Not a valid IP address')
  }
}

document.getElementById('ip').addEventListener('change', search)
document.getElementById('ip').addEventListener('keydown', search)
document.getElementById('ip').addEventListener('keyup', search)
document.getElementById('ip').addEventListener('input', search)
window.onload = () => {
  getIPRanges()
  getRegionNames()
}
