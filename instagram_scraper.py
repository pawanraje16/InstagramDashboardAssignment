import requests
import json
import time
import re
import sys
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import urllib.parse

class InstagramScraperPython:
    def __init__(self):
        self.session = requests.Session()
        self.ua = UserAgent()
        self.base_url = "https://www.instagram.com"

        # Set headers
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def get_user_data_requests(self, username):
        """Method using requests + BeautifulSoup"""
        try:
            url = f"{self.base_url}/{username}/"
            response = self.session.get(url, timeout=10)

            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}'
                }

            soup = BeautifulSoup(response.text, 'html.parser')

            # Method 1: Try to extract from script tags
            scripts = soup.find_all('script', type='text/javascript')
            for script in scripts:
                if script.string and 'window._sharedData' in script.string:
                    # Extract JSON from _sharedData
                    match = re.search(r'window\._sharedData\s*=\s*({.+?});', script.string)
                    if match:
                        shared_data = json.loads(match.group(1))
                        if 'entry_data' in shared_data and 'ProfilePage' in shared_data['entry_data']:
                            user_data = shared_data['entry_data']['ProfilePage'][0]['graphql']['user']
                            return {
                                'success': True,
                                'method': 'SharedData',
                                'data': self._extract_user_info(user_data)
                            }

            # Method 2: Extract from meta tags
            meta_data = self._extract_meta_data(soup)
            if meta_data:
                return {
                    'success': True,
                    'method': 'MetaTags',
                    'data': meta_data
                }

            return {
                'success': False,
                'error': 'Could not extract user data from page'
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Request failed: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Parsing failed: {str(e)}'
            }

    def get_user_data_json_endpoint(self, username):
        """Try Instagram's unofficial JSON endpoints"""
        endpoints = [
            f"{self.base_url}/{username}/?__a=1&__d=dis",
            f"{self.base_url}/api/v1/users/web_profile_info/?username={username}",
            f"{self.base_url}/{username}/?__a=1",
        ]

        headers = {
            **self.session.headers,
            'X-IG-App-ID': '936619743392459',
            'X-ASBD-ID': '198387',
            'X-Requested-With': 'XMLHttpRequest',
        }

        for endpoint in endpoints:
            try:
                response = self.session.get(endpoint, headers=headers, timeout=10)

                if response.status_code == 200:
                    try:
                        data = response.json()
                        if 'graphql' in data and 'user' in data['graphql']:
                            return {
                                'success': True,
                                'method': f'JSON_Endpoint: {endpoint}',
                                'data': self._extract_user_info(data['graphql']['user'])
                            }
                        elif 'data' in data and 'user' in data['data']:
                            return {
                                'success': True,
                                'method': f'JSON_Endpoint: {endpoint}',
                                'data': self._extract_user_info(data['data']['user'])
                            }
                    except json.JSONDecodeError:
                        continue

            except requests.exceptions.RequestException:
                continue

        return {
            'success': False,
            'error': 'All JSON endpoints failed'
        }

    def _extract_user_info(self, user_data):
        """Extract standardized user info from Instagram API response"""
        try:
            return {
                'id': user_data.get('id'),
                'username': user_data.get('username'),
                'full_name': user_data.get('full_name'),
                'biography': user_data.get('biography'),
                'followers': user_data.get('edge_followed_by', {}).get('count', 0),
                'following': user_data.get('edge_follow', {}).get('count', 0),
                'posts': user_data.get('edge_owner_to_timeline_media', {}).get('count', 0),
                'profile_pic': user_data.get('profile_pic_url_hd') or user_data.get('profile_pic_url'),
                'is_verified': user_data.get('is_verified', False),
                'is_business': user_data.get('is_business_account', False),
                'external_url': user_data.get('external_url'),
                'is_private': user_data.get('is_private', False)
            }
        except Exception:
            return user_data

    def _extract_meta_data(self, soup):
        """Extract data from meta tags"""
        try:
            title = soup.find('meta', property='og:title')
            description = soup.find('meta', property='og:description')
            image = soup.find('meta', property='og:image')

            username = title.get('content') if title else None
            bio = description.get('content') if description else None
            profile_pic = image.get('content') if image else None

            if username:
                # Try to extract follower count from description
                followers = 0
                following = 0
                posts = 0

                if bio:
                    # Look for patterns like "1.2M Followers, 500 Following, 1,234 Posts"
                    follower_match = re.search(r'([\d,\.]+[KMB]?)\s+Followers', bio, re.IGNORECASE)
                    following_match = re.search(r'([\d,\.]+[KMB]?)\s+Following', bio, re.IGNORECASE)
                    posts_match = re.search(r'([\d,\.]+[KMB]?)\s+Posts', bio, re.IGNORECASE)

                    if follower_match:
                        followers = self._convert_count(follower_match.group(1))
                    if following_match:
                        following = self._convert_count(following_match.group(1))
                    if posts_match:
                        posts = self._convert_count(posts_match.group(1))

                return {
                    'username': username.replace(' (@', '').replace(')', ''),
                    'biography': bio,
                    'profile_pic': profile_pic,
                    'followers': followers,
                    'following': following,
                    'posts': posts
                }
        except Exception:
            pass

        return None

    def _convert_count(self, count_str):
        """Convert count string like '1.2M' to integer"""
        if not count_str:
            return 0

        count_str = count_str.replace(',', '')
        multiplier = 1

        if count_str.endswith('K'):
            multiplier = 1000
            count_str = count_str[:-1]
        elif count_str.endswith('M'):
            multiplier = 1000000
            count_str = count_str[:-1]
        elif count_str.endswith('B'):
            multiplier = 1000000000
            count_str = count_str[:-1]

        try:
            return int(float(count_str) * multiplier)
        except ValueError:
            return 0

    def test_all_methods(self, username):
        """Test all available methods"""
        print(f"\n=== Testing Python scraper for: {username} ===")

        methods = [
            ('JSON Endpoints', self.get_user_data_json_endpoint),
            ('HTML Scraping', self.get_user_data_requests)
        ]

        results = []

        for method_name, method_func in methods:
            print(f"\nTesting {method_name}...")
            result = method_func(username)
            results.append({
                'method': method_name,
                'username': username,
                **result
            })

            print(f"Success: {result['success']}")
            if result['success'] and 'data' in result:
                data = result['data']
                print(f"Username: {data.get('username', 'N/A')}")
                print(f"Followers: {data.get('followers', 'N/A')}")
                print(f"Posts: {data.get('posts', 'N/A')}")
                print(f"Verified: {data.get('is_verified', 'N/A')}")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")

            # Add delay between methods
            time.sleep(2)

        return results

def main():
    """Main function for testing"""
    scraper = InstagramScraperPython()

    # Test usernames
    test_users = ['cristiano', 'therock', 'selenagomez']

    if len(sys.argv) > 1:
        test_users = sys.argv[1:]

    all_results = []

    for username in test_users:
        results = scraper.test_all_methods(username)
        all_results.extend(results)
        time.sleep(3)  # Delay between users

    # Print summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)

    for result in all_results:
        status = "✓ SUCCESS" if result['success'] else "✗ FAILED"
        print(f"{result['username']} ({result['method']}): {status}")

    # Output as JSON for Node.js integration
    if '--json' in sys.argv:
        print("\n" + json.dumps(all_results, indent=2))

if __name__ == "__main__":
    main()