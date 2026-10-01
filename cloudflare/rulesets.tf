# OpenedShelf Cloudflare WAF Rate Limiting & Edge Resilience (Terraform)
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "zone_id" {
  type        = string
  description = "The Cloudflare Zone ID for openedshelf.org"
}

# 1. WAF Rate Limiting Ruleset
resource "cloudflare_ruleset" "zone_rate_limits" {
  zone_id     = var.zone_id
  name        = "OpenedShelf Abuse Prevention & Rate Limiting"
  description = "Protects /submit-tag and /api/search against scraper floods and spam"
  kind        = "zone"
  phase       = "http_ratelimit"

  # Rule 1: Tag Proposal Abuse Prevention (10 req/min)
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content_type = "application/json"
        content      = "{\"error\":\"Too many submissions. Please wait 60 seconds before submitting another tag.\",\"retry_after\":60}"
      }
    }
    expression  = "(http.request.uri.path in {\"/submit-tag\" \"/api/submit-tag\" \"/propose\" \"/api/propose\"}) and http.request.method eq \"POST\""
    description = "Limit tag submissions to 10 per minute per IP"
    enabled     = true
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 10
      mitigation_timeout  = 60
    }
  }

  # Rule 2: Search Query Rate Limiting (60 req/min)
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content_type = "application/json"
        content      = "{\"error\":\"Search rate limit exceeded. Please wait a moment.\",\"retry_after\":60}"
      }
    }
    expression  = "(http.request.uri.path in {\"/search\" \"/api/search\"}) and http.request.method eq \"POST\""
    description = "Limit search queries to 60 per minute per IP while safeguarding low-bandwidth users"
    enabled     = true
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 60
      mitigation_timeout  = 60
    }
  }
}

# 2. Edge Cache Ruleset for Static Assets and Sitemaps
resource "cloudflare_ruleset" "edge_cache_rules" {
  zone_id     = var.zone_id
  name        = "OpenedShelf Edge Caching Rules"
  description = "Configures long-lived edge caching for static assets, robots.txt, and sitemaps"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  # Cache static images at the edge for 30 days
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 2592000 # 30 days
      }
      browser_ttl {
        mode    = "override_origin"
        default = 604800 # 7 days
      }
    }
    expression  = "http.request.uri.path.extension in {\"png\" \"jpg\" \"jpeg\" \"svg\" \"ico\" \"webp\"}"
    description = "Edge cache static images for 30 days"
    enabled     = true
  }

  # Cache robots.txt and sitemap.xml at the edge for 7 days
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 604800 # 7 days
      }
      browser_ttl {
        mode    = "override_origin"
        default = 86400 # 1 day
      }
    }
    expression  = "http.request.uri.path in {\"/robots.txt\" \"/sitemap.xml\"}"
    description = "Edge cache robots.txt and sitemap.xml for 7 days"
    enabled     = true
  }
}
