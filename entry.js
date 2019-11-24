const IpAddr = require('ip-address')
const EXAMPLE_IPS = ['54.241.40.178', '18.190.43.251', '54.222.59.179', '13.248.113.190', '13.248.11.186', '52.95.156.30', '54.239.4.59', '52.144.228.220', '54.231.249.126', '52.119.249.145', '13.35.10.89', '3.231.2.9', '18.231.194.9', '18.184.2.128', '99.79.126.229', '13.233.177.2', '34.218.119.49', '52.219.64.100', '150.222.77.80', '52.94.22.44', '35.176.99.141', '2620:107:300f::3e35:3', '2600:1fff:5000::8143', '2600:9000:fff:32::1903:420', '2406:daff:6000::71f:aa80', '2a05:d014::8512:715e:3ad0']
let fetched = false

/*
 * Pre-fetch IP rangse from AWS
 * Prepare two arrays with IPv4 and IPv6 info in each
 */
const getIPRanges = async () => {
  console.log('Fetching AWS IP ranges...')
  const data = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json')
  const j = await data.json()

  // Arrays are reversed so more specific service names are found (eg: EC2 instead of AMAZON)
  window.AWS_RANGE_4 = j.prefixes.map(p => {
    const addr = new IpAddr.Address4(p.ip_prefix)
    return {
      addr,
      region: p.region,
      service: p.service
    }
  }).reverse()
  window.AWS_RANGE_6 = j.ipv6_prefixes.map(p => {
    const addr = new IpAddr.Address6(p.ipv6_prefix)
    return {
      addr,
      region: p.region,
      service: p.service
    }
  }).reverse()
  console.log('...done IP range fetch')
}

/*
 * Pre-fetch region information from https://github.com/jsonmaur/aws-regions
 */
const getRegionNames = async () => {
  console.log('Fetching AWS regions...')
  const data = await fetch('https://raw.githubusercontent.com/jsonmaur/aws-regions/master/regions.json')
  window.AWS_REGIONS = await data.json()
  console.log('...done region fetch')
}

/*
 * Return a random IP from EXAMPLE_IPS array
 * lastID is used to make sure same IP is not sent twice in a row
 */
const getRandomIP = (() => {
  let lastID = -1

  return () => {
    let randomID
    do {
      randomID = Math.floor(Math.random() * EXAMPLE_IPS.length)
    } while (randomID === lastID)
    lastID = randomID
    return EXAMPLE_IPS[randomID]
  }
})()

/*
 * Add the results to DOM
 */
const display = (msg) => {
  document.getElementById('result').innerHTML = msg 
}

/*
 * Generate the results HTML
 * This gets called if and only if user entered a valid IP address
 */
const showResults = (prefix) => {
  if (!prefix) {
    return display('Not an AWS IP')
  }
  let regionName = prefix.region
  const regionData = AWS_REGIONS.find(r => r.code === prefix.region)
  if (regionData) {
    regionName = regionData.full_name
  }
  let out = 'Region: <span>' + regionName + '</span>'
  out += '<br>Region code: <span>' + prefix.region + '</span>'
  out += '<br>Service: <span>' + prefix.service + '</span>'
  out += '<br>Subnet: <span>' + prefix.addr.address + '</span>'
  display(out)
}

/*
 * Check if input IP is valid and call relevant functions to show results
 * Called when the user input is changed
 */
const search = async () => {
  const ipstr = document.getElementById('ip').value
  if (!ipstr.trim()) return display('')

  if (!fetched) {
    return display('Loading...')
  }

  const ip4 = new IpAddr.Address4(ipstr)
  const ip6 = new IpAddr.Address6(ipstr)

  if (ip4.valid) {
    showResults(AWS_RANGE_4.find(p => ip4.isInSubnet(p.addr)))
  } else if (ip6.valid) {
    showResults(AWS_RANGE_6.find(p => ip6.isInSubnet(p.addr)))
  } else {
    display('Not a valid IP address')
  }
  document.getElementById('ip').focus()
}

/*
 * Trigger an example IP result
 * Called when 'Random example' is clicked
 */
const showExample = (e) => {
  e.preventDefault()
  document.getElementById('ip').value = getRandomIP()
  search()
}

document.getElementById('ip').addEventListener('change', search)
document.getElementById('ip').addEventListener('keydown', search)
document.getElementById('ip').addEventListener('keyup', search)
document.getElementById('ip').addEventListener('input', search)

// Select text when clicked
document.getElementById('ip').addEventListener('click', function() { this.select() })

document.getElementById('example').addEventListener('click', showExample)

window.onload = async () => {
  await Promise.all([getIPRanges(), getRegionNames()])
  fetched = true
  // Call `search` in case the user had entered an IP before loading the JSONs
  search()
}
