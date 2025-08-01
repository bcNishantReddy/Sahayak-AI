# -*- coding: utf-8 -*- #
# Copyright 2020 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Vertex AI endpoints list command."""

from __future__ import absolute_import
from __future__ import division
from __future__ import unicode_literals

from googlecloudsdk.api_lib.ai.endpoints import client
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.ai import constants
from googlecloudsdk.command_lib.ai import endpoint_util
from googlecloudsdk.command_lib.ai import flags
from googlecloudsdk.command_lib.ai import region_util
from googlecloudsdk.core import resources

_DEFAULT_FORMAT = """
        table(
            name.basename():label=ENDPOINT_ID,
            displayName,
            deployedModels.yesno(yes=Yes).if(list_model_garden_endpoints_only):label=HAS_DEPLOYED_MODEL,
            deployedModels[0].id.if(list_model_garden_endpoints_only):label=DEPLOYED_MODEL_ID
        )
    """
_API_DEPLOY_FILTER = 'labels.mg-deploy:*'
_ONE_CLICK_DEPLOY_FILTER = 'labels.mg-one-click-deploy:*'


def _GetUri(endpoint):
  ref = resources.REGISTRY.ParseRelativeName(endpoint.name,
                                             constants.ENDPOINTS_COLLECTION)
  return ref.SelfLink()


def _AddArgs(parser):
  parser.display_info.AddFormat(_DEFAULT_FORMAT)
  parser.display_info.AddUriFunc(_GetUri)
  flags.AddRegionResourceArg(
      parser, 'to list endpoints', prompt_func=region_util.PromptForOpRegion)
  parser.add_argument(
      '--list-model-garden-endpoints-only',
      action='store_true',
      default=False,
      required=False,
      help='Whether to only list endpoints related to Model Garden.',
  )


def _Run(args, version):
  """List existing Vertex AI endpoints."""
  region_ref = args.CONCEPTS.region.Parse()
  args.region = region_ref.AsDict()['locationsId']

  with endpoint_util.AiplatformEndpointOverrides(version, region=args.region):
    if args.list_model_garden_endpoints_only:
      return client.EndpointsClient(version=version).List(
          region_ref,
          ' OR '.join([_API_DEPLOY_FILTER, _ONE_CLICK_DEPLOY_FILTER]),
      )
    elif version == constants.BETA_VERSION:
      return client.EndpointsClient(version=version).List(
          region_ref, gdc_zone=args.gdc_zone
      )
    else:
      return client.EndpointsClient(version=version).List(region_ref)


@base.ReleaseTracks(base.ReleaseTrack.GA)
@base.DefaultUniverseOnly
class ListGa(base.ListCommand):
  """List existing Vertex AI endpoints.

  ## EXAMPLES

  To list the endpoints under project ``example'' in region ``us-central1'',
  run:

    $ {command} --project=example --region=us-central1

  To list the endpoints under project ``example'' in region ``us-central1''
  that are created from Model Garden, run:

    $ {command} --project=example --region=us-central1
    --list-model-garden-endpoints-only
  """

  @staticmethod
  def Args(parser):
    _AddArgs(parser)

  def Run(self, args):
    return _Run(args, constants.GA_VERSION)


@base.ReleaseTracks(base.ReleaseTrack.BETA, base.ReleaseTrack.ALPHA)
@base.DefaultUniverseOnly
class ListBeta(base.ListCommand):
  """List existing Vertex AI endpoints.

  ## EXAMPLES

  To list the endpoints under project ``example'' in region ``us-central1'',
  run:

    $ {command} --project=example --region=us-central1

  To list the endpoints under project ``example'' in region ``us-central1''
  that are created from Model Garden, run:

    $ {command} --project=example --region=us-central1
    --list-model-garden-endpoints-only
  """

  @staticmethod
  def Args(parser):
    _AddArgs(parser)
    flags.GetGdcZoneArg().AddToParser(parser)

  def Run(self, args):
    return _Run(args, constants.BETA_VERSION)
