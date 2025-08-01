# -*- coding: utf-8 -*- #
# Copyright 2025 Google LLC. All Rights Reserved.
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
"""Command for performing maintenance on a reservation sub-block."""

from __future__ import absolute_import
from __future__ import division
from __future__ import unicode_literals

from googlecloudsdk.api_lib.compute import base_classes
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.compute import flags as compute_flags
from googlecloudsdk.command_lib.compute import scope as compute_scope
from googlecloudsdk.command_lib.compute.reservations import resource_args
from googlecloudsdk.command_lib.compute.reservations.sub_blocks import flags


@base.UniverseCompatible
@base.ReleaseTracks(base.ReleaseTrack.ALPHA, base.ReleaseTrack.BETA,
                    base.ReleaseTrack.GA)
class PerformMaintenance(base.UpdateCommand):
  """Perform maintenance on a reservation sub-block."""

  @staticmethod
  def Args(parser):
    resource_args.GetReservationResourceArg().AddArgument(
        parser, operation_type='perform-maintenance')
    flags.AddDescribeFlags(parser)

  def Run(self, args):
    holder = base_classes.ComputeApiHolder(self.ReleaseTrack())
    client = holder.client

    reservation_ref = resource_args.GetReservationResourceArg(
    ).ResolveAsResource(
        args,
        holder.resources,
        default_scope=compute_scope.ScopeEnum.ZONE,
        scope_lister=compute_flags.GetDefaultScopeLister(client))

    parent_name = f'reservations/{reservation_ref.reservation}/reservationBlocks/{args.block_name}'

    request = (
        client.messages.ComputeReservationSubBlocksPerformMaintenanceRequest(
            parentName=parent_name,
            zone=reservation_ref.zone,
            project=reservation_ref.project,
            reservationSubBlock=args.sub_block_name
        )
    )

    return client.MakeRequests([(client.apitools_client.reservationSubBlocks,
                                 'PerformMaintenance', request)])

PerformMaintenance.detailed_help = {
    'EXAMPLES':
        """\
    To perform maintenance on a reservation sub-block in reservation exr-1
    in ZONE with block name block-1 and sub-block name sub-block-1, run:

      $ {command} exr-1 --zone=ZONE --block-name=block-1
          --sub-block-name=sub-block-1
    """,
}
